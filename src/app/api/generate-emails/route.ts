import { NextRequest, NextResponse } from "next/server";
import { getDbUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateBatchEmails, RecipientData, UserProfileData } from "@/lib/ai-generator";
import { getCompanyFromEmail, inferNameFromEmail } from "@/lib/company-lookup";

/**
 * POST /api/generate-emails — Generate unique, AI-personalized cold emails for recipients
 */
export async function POST(req: NextRequest) {
  const user = await getDbUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { recipientIds, recipients: directRecipients, goal, customInstructions, tone } = body;

    let recipientsToGenerate: RecipientData[] = [];

    // Option A: Fetch recipients by ID from database
    if (Array.isArray(recipientIds) && recipientIds.length > 0) {
      const dbRecipients = await prisma.recipient.findMany({
        where: {
          id: { in: recipientIds },
          userId: user.id,
        },
      });

      recipientsToGenerate = dbRecipients.map((r) => ({
        id: r.id,
        email: r.email,
        name: r.name || inferNameFromEmail(r.email),
        company: r.company || getCompanyFromEmail(r.email),
      }));
    } else if (Array.isArray(directRecipients) && directRecipients.length > 0) {
      // Option B: Provided directly in body
      recipientsToGenerate = directRecipients.map((r: { email: string; name?: string; company?: string; id?: string }) => ({
        id: r.id,
        email: r.email,
        name: r.name || inferNameFromEmail(r.email),
        company: r.company || getCompanyFromEmail(r.email),
      }));
    }

    if (recipientsToGenerate.length === 0) {
      return NextResponse.json({ error: "No recipients provided" }, { status: 400 });
    }

    // Fetch user profile
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: user.id },
    });

    const profileData: UserProfileData = {
      fullName: userProfile?.fullName || user.name || "User",
      currentRole: userProfile?.currentRole || "Software Engineering Student",
      skills: userProfile?.skills || "React, Next.js, Node.js, TypeScript, Python",
      bio: userProfile?.bio || "Passionate about building scalable software products.",
      targetRoles: userProfile?.targetRoles || "Software Engineer Intern",
      portfolioUrl: userProfile?.portfolioUrl,
      linkedinUrl: userProfile?.linkedinUrl,
      githubUrl: userProfile?.githubUrl,
    };

    const results = await generateBatchEmails(recipientsToGenerate, profileData, {
      goal: goal || userProfile?.defaultGoal || "internship",
      customInstructions,
      tone,
    });

    return NextResponse.json({ emails: results });
  } catch (error) {
    console.error("[Generate Emails API] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate emails" },
      { status: 500 }
    );
  }
}
