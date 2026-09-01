import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

/**
 * Get the database user for the currently authenticated Clerk user.
 * Optimized: uses auth() JWT for zero-network-overhead fast lookup.
 * Only calls Clerk currentUser() and upsert on the user's first login.
 */
export async function getDbUser() {
  try {
    const { userId } = await auth();
    if (!userId) return null;

    // Fast path: cached DB lookup by indexed clerkId (1 query, 0 external API calls)
    const existing = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (existing) {
      return existing;
    }

    // Slow path (first visit only): fetch full profile & create user in DB
    const clerkUser = await currentUser();
    if (!clerkUser) return null;

    const email =
      clerkUser.primaryEmailAddress?.emailAddress ||
      clerkUser.emailAddresses[0]?.emailAddress;

    if (!email) return null;

    return await prisma.user.upsert({
      where: { clerkId: clerkUser.id },
      update: {
        name: clerkUser.fullName || clerkUser.firstName || undefined,
        email,
        image: clerkUser.imageUrl || undefined,
      },
      create: {
        clerkId: clerkUser.id,
        email,
        name: clerkUser.fullName || clerkUser.firstName || null,
        image: clerkUser.imageUrl || null,
      },
    });
  } catch (err) {
    console.error("[getDbUser error]", err);
    return null;
  }
}

/**
 * Get the database user or throw 401 error.
 * Convenience wrapper for API routes.
 */
export async function requireDbUser() {
  const user = await getDbUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}
