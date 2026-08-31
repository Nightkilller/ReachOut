import { NextRequest, NextResponse } from "next/server";
import { getDbUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/campaigns — list all campaigns for the authenticated user.
 */
export async function GET() {
  const user = await getDbUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const campaigns = await prisma.campaign.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { emails: true },
      },
    },
  });

  return NextResponse.json(campaigns);
}

/**
 * POST /api/campaigns — create a new campaign.
 * Body: {
 *   subject: string,
 *   body: string,
 *   recipientIds: string[],
 *   attachmentPath?: string,
 *   attachmentName?: string,
 *   customEmails?: { recipientId: string; subject: string; body: string }[]
 * }
 */
export async function POST(req: NextRequest) {
  const user = await getDbUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await req.json();
  const { subject, body, recipientIds, attachmentPath, attachmentName, customEmails } = data;

  if (!subject || !body || !Array.isArray(recipientIds) || recipientIds.length === 0) {
    return NextResponse.json(
      { error: "subject, body, and recipientIds are required" },
      { status: 400 }
    );
  }

  // Map custom emails if provided
  const customMap = new Map<string, { subject: string; body: string }>();
  if (Array.isArray(customEmails)) {
    for (const item of customEmails) {
      if (item.recipientId) {
        customMap.set(item.recipientId, {
          subject: item.subject,
          body: item.body,
        });
      }
    }
  }

  // Verify all recipients belong to this user
  const recipients = await prisma.recipient.findMany({
    where: {
      id: { in: recipientIds },
      userId: user.id,
    },
  });

  if (recipients.length === 0) {
    return NextResponse.json(
      { error: "No valid recipients found" },
      { status: 400 }
    );
  }

  // Create campaign with campaign emails
  const campaign = await prisma.campaign.create({
    data: {
      subject,
      body,
      attachmentPath: attachmentPath || null,
      attachmentName: attachmentName || null,
      status: "draft",
      totalCount: recipients.length,
      userId: user.id,
      emails: {
        create: recipients.map((r) => {
          const custom = customMap.get(r.id);
          return {
            recipientId: r.id,
            status: "pending",
            customSubject: custom?.subject || null,
            customBody: custom?.body || null,
          };
        }),
      },
    },
    include: {
      emails: {
        include: { recipient: true },
      },
    },
  });

  return NextResponse.json(campaign);
}
