import { NextRequest, NextResponse } from "next/server";
import { getDbUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseCSV, isValidEmail } from "@/lib/csv";
import { getCompanyFromEmail, inferNameFromEmail } from "@/lib/company-lookup";

/**
 * GET /api/recipients — list all recipients for the authenticated user.
 */
export async function GET() {
  const user = await getDbUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const recipients = await prisma.recipient.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(recipients);
}

/**
 * POST /api/recipients — bulk-add recipients.
 * Accepts either:
 *   - { recipients: [{ email, name?, company? }] }  (JSON array)
 *   - { csv: "..." }  (raw CSV text to parse)
 */
export async function POST(req: NextRequest) {
  const user = await getDbUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  let toAdd: { email: string; name?: string; company?: string }[] = [];

  if (body.csv) {
    // Parse CSV text
    toAdd = parseCSV(body.csv);
  } else if (Array.isArray(body.recipients)) {
    toAdd = body.recipients.filter(
      (r: { email?: string }) => r.email && isValidEmail(r.email)
    );
  } else {
    return NextResponse.json(
      { error: "Provide 'csv' or 'recipients' array" },
      { status: 400 }
    );
  }

  if (toAdd.length === 0) {
    return NextResponse.json(
      { error: "No valid recipients found" },
      { status: 400 }
    );
  }

  // Auto-detect company and name if missing
  const preparedRecipients = toAdd.map((r) => {
    const cleanEmail = r.email.trim().toLowerCase();
    const inferredCompany = r.company?.trim() || getCompanyFromEmail(cleanEmail) || null;
    const inferredName = r.name?.trim() || inferNameFromEmail(cleanEmail) || null;
    return {
      email: cleanEmail,
      name: inferredName,
      company: inferredCompany,
    };
  });

  // Upsert each recipient (skip duplicates for this user)
  const results = await Promise.allSettled(
    preparedRecipients.map((r) =>
      prisma.recipient.upsert({
        where: {
          userId_email: {
            userId: user.id,
            email: r.email,
          },
        },
        update: {
          ...(r.name ? { name: r.name } : {}),
          ...(r.company ? { company: r.company } : {}),
        },
        create: {
          email: r.email,
          name: r.name,
          company: r.company,
          userId: user.id,
        },
      })
    )
  );

  const added = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  return NextResponse.json({ added, failed, total: toAdd.length });
}

/**
 * DELETE /api/recipients?id=xxx — delete a single recipient.
 * Or DELETE /api/recipients with body { ids: [...] } for bulk delete.
 */
export async function DELETE(req: NextRequest) {
  const user = await getDbUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const singleId = searchParams.get("id");

  if (singleId) {
    await prisma.recipient.deleteMany({
      where: { id: singleId, userId: user.id },
    });
    return NextResponse.json({ deleted: 1 });
  }

  // Bulk delete
  const body = await req.json().catch(() => null);
  if (body?.ids && Array.isArray(body.ids)) {
    const result = await prisma.recipient.deleteMany({
      where: {
        id: { in: body.ids },
        userId: user.id,
      },
    });
    return NextResponse.json({ deleted: result.count });
  }

  return NextResponse.json({ error: "Provide 'id' param or 'ids' array" }, { status: 400 });
}
