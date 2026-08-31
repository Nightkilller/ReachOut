import { NextResponse } from "next/server";
import { getDbUser } from "@/lib/auth";
import { getTodaySentCount, SAFE_DAILY_LIMIT, MAX_DAILY_LIMIT } from "@/lib/send-limits";

/**
 * GET /api/campaigns/limits — get current daily send usage for the authenticated user.
 */
export async function GET() {
  const user = await getDbUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sentToday = await getTodaySentCount(user.id);
  const remaining = Math.max(0, SAFE_DAILY_LIMIT - sentToday);

  return NextResponse.json({
    sentToday,
    remaining,
    safeLimit: SAFE_DAILY_LIMIT,
    maxLimit: MAX_DAILY_LIMIT,
  });
}
