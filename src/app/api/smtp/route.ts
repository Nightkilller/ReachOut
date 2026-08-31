import { NextRequest, NextResponse } from "next/server";
import { getDbUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/encryption";

/**
 * GET /api/smtp — get current SMTP configuration status
 */
export async function GET() {
  try {
    const user = await getDbUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
      smtpEmail: user.smtpEmail || null,
      hasPassword: !!user.smtpPassword,
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

/**
 * POST /api/smtp — save SMTP credentials (email + app password)
 * Body: { email: string, password: string }
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getDbUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Encrypt the app password before storing
    const encryptedPassword = encrypt(password);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        smtpEmail: email.trim().toLowerCase(),
        smtpPassword: encryptedPassword,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[SMTP API] Error saving config:", error);
    return NextResponse.json(
      { error: "Failed to save SMTP configuration" },
      { status: 500 }
    );
  }
}
