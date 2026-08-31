import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

/**
 * Get the database user for the currently authenticated Clerk user.
 * Creates the user record on first login (upsert pattern).
 * Returns null if not authenticated.
 */
export async function getDbUser() {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email =
    clerkUser.primaryEmailAddress?.emailAddress ||
    clerkUser.emailAddresses[0]?.emailAddress;

  if (!email) return null;

  return prisma.user.upsert({
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
