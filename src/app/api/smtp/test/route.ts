import { NextRequest, NextResponse } from "next/server";
import { getDbUser } from "@/lib/auth";
import { testSmtpConnection } from "@/lib/mailer";

/**
 * POST /api/smtp/test — test SMTP connection with provided credentials
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

    const result = await testSmtpConnection(email, password);

    if (result.success) {
      return NextResponse.json({ success: true, message: "Connection successful!" });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("[SMTP Test] Error:", error);
    return NextResponse.json(
      { error: "Failed to test connection" },
      { status: 500 }
    );
  }
}
