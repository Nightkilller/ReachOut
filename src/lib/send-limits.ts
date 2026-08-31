/**
 * Daily send limit protection for Gmail SMTP.
 * Tracks how many emails the user has sent today and enforces safe limits
 * to prevent Gmail from blocking or penalizing the account.
 */

import { prisma } from "@/lib/prisma";

/** Safe daily limit for free Gmail accounts (well under the 500 hard limit) */
export const SAFE_DAILY_LIMIT = 100;

/** Absolute maximum — approaching Gmail's hard limit */
export const MAX_DAILY_LIMIT = 450;

/**
 * Count how many emails this user has successfully sent today.
 */
export async function getTodaySentCount(userId: string): Promise<number> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const count = await prisma.campaignEmail.count({
    where: {
      status: "sent",
      sentAt: { gte: startOfDay },
      campaign: { userId },
    },
  });

  return count;
}

/**
 * Check whether the user can safely send `additionalCount` more emails today.
 * Returns an object with:
 *   - allowed: whether sending is permitted
 *   - sentToday: how many have been sent already
 *   - remaining: how many more can be sent within the safe limit
 *   - warning: optional warning message if approaching the limit
 */
export async function checkSendLimits(
  userId: string,
  additionalCount: number
): Promise<{
  allowed: boolean;
  sentToday: number;
  remaining: number;
  warning: string | null;
}> {
  const sentToday = await getTodaySentCount(userId);
  const remaining = Math.max(0, SAFE_DAILY_LIMIT - sentToday);
  const totalAfterSend = sentToday + additionalCount;

  // Hard block: would exceed Gmail's absolute limit
  if (totalAfterSend > MAX_DAILY_LIMIT) {
    return {
      allowed: false,
      sentToday,
      remaining,
      warning: `Blocked: Sending ${additionalCount} more would bring your total to ${totalAfterSend} today, exceeding Gmail's daily limit of ~${MAX_DAILY_LIMIT}. Your account could be temporarily suspended. Try again tomorrow.`,
    };
  }

  // Soft warning: exceeding safe limit but below hard limit
  if (totalAfterSend > SAFE_DAILY_LIMIT) {
    return {
      allowed: true,
      sentToday,
      remaining,
      warning: `⚠️ Caution: You've sent ${sentToday} emails today. Sending ${additionalCount} more (total ${totalAfterSend}) exceeds the recommended safe limit of ${SAFE_DAILY_LIMIT}/day. Proceed carefully to avoid Gmail rate limits.`,
    };
  }

  return {
    allowed: true,
    sentToday,
    remaining,
    warning: null,
  };
}
