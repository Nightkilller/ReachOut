import { NextRequest, NextResponse } from "next/server";
import { getDbUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/profile — fetch current user's profile settings
 */
export async function GET() {
  const user = await getDbUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.userProfile.findUnique({
    where: { userId: user.id },
  });

  if (!profile) {
    // Return default pre-filled from user data
    return NextResponse.json({
      fullName: user.name || "",
      currentRole: "Software Engineering Student",
      skills: "React, Next.js, TypeScript, Node.js, Python, PostgreSQL",
      bio: "Passionate developer looking to build impact-driven products.",
      targetRoles: "Software Development Engineer (SDE) Intern",
      portfolioUrl: "",
      linkedinUrl: "",
      githubUrl: "",
      defaultGoal: "internship",
    });
  }

  return NextResponse.json(profile);
}

/**
 * POST /api/profile — create or update user's profile settings
 */
export async function POST(req: NextRequest) {
  const user = await getDbUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await req.json();

    const profile = await prisma.userProfile.upsert({
      where: { userId: user.id },
      update: {
        fullName: data.fullName,
        currentRole: data.currentRole,
        skills: data.skills,
        bio: data.bio,
        targetRoles: data.targetRoles,
        portfolioUrl: data.portfolioUrl,
        linkedinUrl: data.linkedinUrl,
        githubUrl: data.githubUrl,
        defaultGoal: data.defaultGoal || "internship",
      },
      create: {
        userId: user.id,
        fullName: data.fullName || user.name || "",
        currentRole: data.currentRole,
        skills: data.skills,
        bio: data.bio,
        targetRoles: data.targetRoles,
        portfolioUrl: data.portfolioUrl,
        linkedinUrl: data.linkedinUrl,
        githubUrl: data.githubUrl,
        defaultGoal: data.defaultGoal || "internship",
      },
    });

    return NextResponse.json(profile);
  } catch (error) {
    console.error("[Profile API] Error saving profile:", error);
    return NextResponse.json(
      { error: "Failed to save profile" },
      { status: 500 }
    );
  }
}
