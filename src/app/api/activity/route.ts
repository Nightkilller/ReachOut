import { NextResponse } from "next/server";
import { getDbUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/activity — Get all sent/outreach emails grouped by date for the calendar view.
 */
export async function GET() {
  const user = await getDbUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const emails = await prisma.campaignEmail.findMany({
      where: {
        campaign: { userId: user.id },
      },
      include: {
        recipient: {
          select: {
            id: true,
            email: true,
            name: true,
            company: true,
          },
        },
        campaign: {
          select: {
            id: true,
            subject: true,
            body: true,
            attachmentName: true,
            createdAt: true,
          },
        },
      },
      orderBy: [
        { sentAt: "desc" },
        { campaign: { createdAt: "desc" } },
      ],
    });

    const formatted = emails.map((item) => {
      const dateToUse = item.sentAt || item.campaign.createdAt;
      return {
        id: item.id,
        status: item.status,
        error: item.error,
        sentAt: item.sentAt ? item.sentAt.toISOString() : null,
        dateKey: dateToUse ? new Date(dateToUse).toISOString().split("T")[0] : null,
        subject: item.customSubject || item.campaign.subject,
        body: item.customBody || item.campaign.body,
        attachmentName: item.campaign.attachmentName,
        recipient: item.recipient,
        campaignId: item.campaign.id,
      };
    });

    return NextResponse.json({ emails: formatted });
  } catch (error) {
    console.error("[Activity API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch outreach calendar activity" },
      { status: 500 }
    );
  }
}
