/**
 * AI Cold Email Generation Engine supporting Groq (LLaMA 3.3 70B) & Google Gemini.
 * Generates unique, highly personalized cold outreach emails per company and recipient.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

export interface RecipientData {
  id?: string;
  email: string;
  name?: string | null;
  company?: string | null;
}

export interface UserProfileData {
  fullName?: string | null;
  currentRole?: string | null;
  skills?: string | null;
  bio?: string | null;
  targetRoles?: string | null;
  portfolioUrl?: string | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
}

export interface GenerateOptions {
  goal?: "internship" | "fulltime" | "networking" | "sales" | "custom" | string;
  customInstructions?: string;
  tone?: "professional" | "enthusiastic" | "concise" | "casual" | string;
}

export interface GeneratedEmailResult {
  recipientId?: string;
  email: string;
  company: string;
  recipientName: string;
  subject: string;
  body: string;
}

/**
 * Generate a personalized cold email for a single recipient using Groq or Gemini.
 */
export async function generateSingleEmail(
  recipient: RecipientData,
  profile: UserProfileData,
  options: GenerateOptions = {}
): Promise<GeneratedEmailResult> {
  const groqApiKey = process.env.GROQ_API_KEY;
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const company = recipient.company || "your team";
  const recipientName = recipient.name || "Hiring Team";
  const senderName = profile.fullName || "Aditya";
  const role = profile.currentRole || "Software Engineering Student";
  const skills = profile.skills || "Full Stack Development, React, Node.js, TypeScript, Python";
  const targetRoles = profile.targetRoles || "Software Engineer / Intern";
  const goal = options.goal || "internship";
  const tone = options.tone || "concise and confident";

  const prompt = `You are an expert cold email copywriter who writes high-converting, personalized cold outreach emails that get replies from recruiters, founders, and hiring managers.

Task: Write a personalized, authentic, and compelling cold email from the sender to the recipient.

--- SENDER DETAILS ---
- Name: ${senderName}
- Current Background: ${role}
- Key Skills: ${skills}
- Summary / Bio: ${profile.bio || "Passionate software builder looking to create high impact."}
- Target Role: ${targetRoles}
${profile.portfolioUrl ? `- Portfolio: ${profile.portfolioUrl}` : ""}
${profile.linkedinUrl ? `- LinkedIn: ${profile.linkedinUrl}` : ""}
${profile.githubUrl ? `- GitHub: ${profile.githubUrl}` : ""}

--- RECIPIENT DETAILS ---
- Name: ${recipientName}
- Email: ${recipient.email}
- Company: ${company}

--- OUTREACH GOAL & TONE ---
- Goal: ${goal} (e.g. seeking an internship/job role or building connection)
- Tone: ${tone}
- Additional User Notes / Instructions: ${options.customInstructions || "Tailor specifically to why I admire and want to contribute to " + company + "."}

--- RULES FOR COLD EMAIL ---
1. Subject line: Short, engaging, personalized, no spam triggers (e.g., "${targetRoles} Opportunity at ${company} - ${senderName}").
2. Body:
   - Hook: Personalized opening acknowledging ${company} and ${recipientName}.
   - Value / Proof: Briefly mention 1-2 relevant technical strengths or projects and why they fit ${company}.
   - Specificity: Reference something authentic about ${company}'s domain or engineering culture.
   - Low-friction Call to Action (CTA): Ask for a brief 10-minute chat or guidance on next steps.
   - Signoff: Professional closing from ${senderName} with relevant links if available.
3. Keep it under 150-180 words. People are busy; make every word count.
4. Return ONLY a valid JSON object in the exact schema below:

{
  "subject": "string",
  "body": "string (with newline characters for paragraphs)"
}`;

  // Strategy 1: Use Groq if available (Super fast 120B reasoning model)
  if (groqApiKey) {
    try {
      const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${groqApiKey}`,
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          messages: [
            {
              role: "system",
              content: "You are an expert cold email copywriter. You must output ONLY a valid JSON object with keys 'subject' and 'body'.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          response_format: { type: "json_object" },
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (groqRes.ok) {
        const data = await groqRes.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          return {
            recipientId: recipient.id,
            email: recipient.email,
            company,
            recipientName,
            subject: parsed.subject || `Inquiry regarding ${targetRoles} at ${company}`,
            body: parsed.body || "",
          };
        }
      } else {
        const errText = await groqRes.text();
        console.error("[Groq API] Error:", errText);
      }
    } catch (err) {
      console.error("[Groq API] Execution error:", err);
    }
  }

  // Strategy 2: Use Gemini if available
  if (geminiApiKey) {
    try {
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: {
          temperature: 0.7,
          topP: 0.95,
          maxOutputTokens: 800,
          responseMimeType: "application/json",
        },
      });

      const response = await model.generateContent(prompt);
      const text = response.response.text();
      const parsed = JSON.parse(text);

      return {
        recipientId: recipient.id,
        email: recipient.email,
        company,
        recipientName,
        subject: parsed.subject || `Inquiry regarding ${targetRoles} at ${company}`,
        body: parsed.body || "",
      };
    } catch (error) {
      console.error(`[Gemini API] Error generating email for ${recipient.email}:`, error);
    }
  }

  // Strategy 3: Intelligent fallback template
  return generateFallbackEmail(recipient, profile, options);
}

/**
 * Batch generate personalized emails for multiple recipients with concurrency control.
 */
export async function generateBatchEmails(
  recipients: RecipientData[],
  profile: UserProfileData,
  options: GenerateOptions = {}
): Promise<GeneratedEmailResult[]> {
  const results: GeneratedEmailResult[] = [];
  const chunkSize = 5;

  for (let i = 0; i < recipients.length; i += chunkSize) {
    const chunk = recipients.slice(i, i + chunkSize);
    const chunkPromises = chunk.map((r) => generateSingleEmail(r, profile, options));
    const chunkResults = await Promise.all(chunkPromises);
    results.push(...chunkResults);
  }

  return results;
}

/**
 * High-quality fallback template generator if AI keys are missing or offline.
 */
function generateFallbackEmail(
  recipient: RecipientData,
  profile: UserProfileData,
  options: GenerateOptions = {}
): GeneratedEmailResult {
  const company = recipient.company || "your team";
  const recipientName = recipient.name || "Team";
  const senderName = profile.fullName || "Aditya";
  const role = profile.currentRole || "Software Engineering Student";
  const skills = profile.skills || "React, TypeScript, Node.js, and Python";
  const targetRoles = profile.targetRoles || "Software Engineering Intern";

  const subjects = [
    `${targetRoles} inquiry — ${senderName} / ${company}`,
    `Quick note from ${senderName} | ${targetRoles} @ ${company}`,
    `Interest in Engineering opportunities at ${company}`,
    `Excited about ${company} — ${targetRoles} inquiry`,
  ];
  const subject = subjects[Math.floor(Math.random() * subjects.length)];

  const links = [];
  if (profile.portfolioUrl) links.push(`Portfolio: ${profile.portfolioUrl}`);
  if (profile.githubUrl) links.push(`GitHub: ${profile.githubUrl}`);
  if (profile.linkedinUrl) links.push(`LinkedIn: ${profile.linkedinUrl}`);
  const linksText = links.length > 0 ? `\n\n${links.join(" | ")}` : "";

  const body = `Hi ${recipientName},

I hope you're doing well.

I've been following ${company}'s work and really admire what your engineering team is building. I am a ${role} with strong hands-on experience in ${skills}.

I am actively looking for a ${targetRoles} role where I can contribute to building high-quality features and solving complex engineering challenges at ${company}.

I have attached my resume for your review. Would you be open to a quick 10-minute conversation this week, or could you point me to the best person on the team to speak with?

Thanks for your time and consideration!

Best regards,
${senderName}${linksText}`;

  return {
    recipientId: recipient.id,
    email: recipient.email,
    company,
    recipientName,
    subject,
    body,
  };
}
