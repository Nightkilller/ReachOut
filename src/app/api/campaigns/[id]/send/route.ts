import { NextRequest, NextResponse } from "next/server";
import { getDbUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMailCredentials, createGmailTransporter, getSenderEmail, sendEmail } from "@/lib/mailer";
import { applyMergeTags } from "@/lib/mime";
import { checkSendLimits } from "@/lib/send-limits";
import { humanizeEmail } from "@/lib/humanizer";

export const maxDuration = 300;

/** Default delay between emails in seconds */
const DEFAULT_DELAY_SECONDS = 5;
/** Minimum allowed delay (0 seconds for instant delivery) */
const MIN_DELAY_SECONDS = 0;
/** Maximum allowed delay */
const MAX_DELAY_SECONDS = 300;

/**
 * POST /api/campaigns/[id]/send — execute a campaign.
 * Sends individual emails to each recipient via Gmail SMTP.
 *
 * Optional body params:
 *   - delaySeconds: number (0-300, default 5) — gap between each email
 *   - skipLimitCheck: boolean — override daily limit warning (still blocked at hard limit)
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getDbUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Parse optional body params
  let delaySeconds = DEFAULT_DELAY_SECONDS;
  let skipLimitCheck = false;
  try {
    const body = await req.json();
    if (body.delaySeconds != null) {
      delaySeconds = Math.max(
        MIN_DELAY_SECONDS,
        Math.min(MAX_DELAY_SECONDS, Number(body.delaySeconds))
      );
    }
    if (body.skipLimitCheck === true) {
      skipLimitCheck = true;
    }
  } catch {
    // No body or invalid JSON — use defaults
  }

  // Get campaign with pending or failed emails (allows retrying)
  const campaign = await prisma.campaign.findFirst({
    where: { id, userId: user.id },
    include: {
      emails: {
        where: { status: { in: ["pending", "failed"] } },
        include: { recipient: true },
      },
    },
  });

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  if (campaign.emails.length === 0) {
    return NextResponse.json(
      { error: "No pending emails to send" },
      { status: 400 }
    );
  }

  // ── Daily send limit check ──
  const limitCheck = await checkSendLimits(user.id, campaign.emails.length);

  if (!limitCheck.allowed) {
    return NextResponse.json(
      {
        error: limitCheck.warning,
        sentToday: limitCheck.sentToday,
        remaining: limitCheck.remaining,
      },
      { status: 429 }
    );
  }

  if (limitCheck.warning && !skipLimitCheck) {
    return NextResponse.json(
      {
        error: limitCheck.warning,
        sentToday: limitCheck.sentToday,
        remaining: limitCheck.remaining,
        requiresConfirmation: true,
      },
      { status: 429 }
    );
  }

  // Get SMTP credentials and create transporter
  let mailCredentials;
  let transporter;
  try {
    mailCredentials = await getMailCredentials(user.id);
    transporter = createGmailTransporter(mailCredentials.email, mailCredentials.pass, 465);
  } catch (error) {
    return NextResponse.json(
      { error: `Gmail SMTP configuration error: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 }
    );
  }

  // Get sender email & name
  const senderEmail = mailCredentials.email || (await getSenderEmail(user.id));
  const senderDisplayName = user.name ? user.name.replace(/["\r\n]/g, "") : "";
  const fromAddress = senderDisplayName ? `"${senderDisplayName}" <${senderEmail}>` : senderEmail;

  // Update campaign status to sending
  await prisma.campaign.update({
    where: { id },
    data: { status: "sending" },
  });

  let sentCount = campaign.sentCount;
  let failedCount = campaign.failedCount;

  // ── Send emails one by one with configurable delay ──
  for (let i = 0; i < campaign.emails.length; i++) {
    const campaignEmail = campaign.emails[i];
    const recipient = campaignEmail.recipient;

    try {
      // Determine subject and HTML body
      let finalSubject = campaignEmail.customSubject;
      if (!finalSubject) {
        finalSubject = applyMergeTags(campaign.subject, {
          email: recipient.email,
          name: recipient.name,
          company: recipient.company,
        });
      }

      let finalBody = campaignEmail.customBody;
      if (finalBody) {
        // If it's plain text without HTML paragraph/break tags, convert newlines to <br>
        if (!finalBody.includes("<p>") && !finalBody.includes("<br>")) {
          finalBody = finalBody.replace(/\n/g, "<br>");
        }
      } else {
        finalBody = applyMergeTags(campaign.body, {
          email: recipient.email,
          name: recipient.name,
          company: recipient.company,
        });
        if (!finalBody.includes("<p>") && !finalBody.includes("<br>")) {
          finalBody = finalBody.replace(/\n/g, "<br>");
        }
      }

      // ── Humanize the email to make it unique ──
      const isAIGenerated = !!campaignEmail.customBody;
      finalBody = humanizeEmail(finalBody, {
        varyGreetings: !isAIGenerated, // Only vary greetings for templates
        varySignoffs: !isAIGenerated,  // Only vary sign-offs for templates
        insertInvisibleChars: true,     // Always insert invisible chars
        varyWhitespace: true,           // Always vary whitespace
      });

      // Send via Nodemailer SMTP with automatic Port 587 fallback
      await sendEmail(
        transporter,
        {
          from: fromAddress,
          to: recipient.email,
          subject: finalSubject,
          html: finalBody,
          attachmentPath: campaign.attachmentPath,
          attachmentName: campaign.attachmentName,
        },
        mailCredentials
      );

      // Mark as sent
      await prisma.campaignEmail.update({
        where: { id: campaignEmail.id },
        data: { status: "sent", sentAt: new Date(), error: null },
      });

      sentCount++;

      // Update campaign progress
      await prisma.campaign.update({
        where: { id },
        data: { sentCount },
      });

      // ── Configurable delay between sends ──
      // Skip delay after the last email
      if (i < campaign.emails.length - 1 && delaySeconds > 0) {
        await new Promise((resolve) =>
          setTimeout(resolve, delaySeconds * 1000)
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to send via SMTP";

      // Mark as failed
      await prisma.campaignEmail.update({
        where: { id: campaignEmail.id },
        data: { status: "failed", error: errorMessage },
      });

      failedCount++;

      // Update campaign progress
      await prisma.campaign.update({
        where: { id },
        data: { failedCount },
      });
    }
  }

  // Finalize campaign status
  const finalStatus = failedCount === campaign.totalCount ? "failed" : "completed";
  const updatedCampaign = await prisma.campaign.update({
    where: { id },
    data: {
      status: finalStatus,
      sentCount,
      failedCount,
    },
    include: {
      emails: {
        include: { recipient: true },
      },
    },
  });

  const failureErrors = updatedCampaign.emails
    .filter((e) => e.status === "failed")
    .map((e) => ({ email: e.recipient.email, error: e.error }));

  return NextResponse.json({
    ...updatedCampaign,
    errors: failureErrors,
  });
}
