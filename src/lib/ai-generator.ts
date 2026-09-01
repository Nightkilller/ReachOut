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
  const senderName = profile.fullName || "Aditya Gupta";
  const role = profile.currentRole || "Software Engineering Student";
  const skills = profile.skills || "Full Stack Development, React, Node.js, TypeScript, Python";
  const targetRoles = profile.targetRoles || "Software Engineer / Intern";
  const goal = options.goal || "internship";
  const tone = options.tone || "concise and confident";

  const prompt = `You are an elite cold email copywriter who writes high-converting, personalized cold outreach emails that get replies from recruiters, founders, and engineering managers.

Task: Write a personalized, highly authentic, and compelling cold outreach email from the sender to the recipient.

--- SENDER PROFILE ---
- Name: ${senderName}
- Current Background: ${role}
- Key Skills: ${skills}
- Summary / Bio: ${profile.bio || "Passionate software builder dedicated to building scalable and robust web systems."}
- Target Role: ${targetRoles}
${profile.portfolioUrl ? `- Portfolio: ${profile.portfolioUrl}` : ""}
${profile.linkedinUrl ? `- LinkedIn: ${profile.linkedinUrl}` : ""}
${profile.githubUrl ? `- GitHub: ${profile.githubUrl}` : ""}

--- RECIPIENT PROFILE ---
- Name: ${recipientName}
- Email: ${recipient.email}
- Company: ${company}

--- OUTREACH GOAL & TONE ---
- Goal: ${goal} (e.g. seeking an internship, full-time role, or coffee chat)
- Tone: ${tone}
- User Instructions: ${options.customInstructions || "Highlight genuine interest in " + company + " and how my technical skillset directly adds value."}

--- STRICT COPYWRITING RULES ---
1. Subject line: MUST be clean, punchy, professional, and personalized with NO clickbait and NO spam words.
   Examples of great subjects:
   - "${senderName} — ${targetRoles} Inquiry | ${company}"
   - "Exploring ${targetRoles} opportunities at ${company} — ${senderName}"
   - "${senderName} / ${targetRoles} candidate for ${company}"
2. Body:
   - Direct opening acknowledging ${recipientName} and why you are reaching out to ${company}.
   - Brief 2-3 sentence value proposition highlighting relevant hands-on experience and projects in ${skills}.
   - Clear reference to why ${company} stands out to you.
   - Low-friction Call to Action (e.g. "Would you have 10 minutes for a brief chat this week, or could you point me to the right engineering lead?").
   - Professional closing with ${senderName}.
3. Keep the total length concise (120 to 160 words).
4. Return ONLY a valid JSON object in the exact schema below with no extra markdown or explanations:

{
  "subject": "string",
  "body": "string (with newline characters for paragraphs)"
}`;

  // Strategy 1: Use Groq if available (Fast 70B/120B model)
  if (groqApiKey) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${groqApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
          response_format: { type: "json_object" },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          return {
            recipientId: recipient.id,
            email: recipient.email,
            company,
            recipientName,
            subject: parsed.subject || `${senderName} — ${targetRoles} Inquiry | ${company}`,
            body: parsed.body || "",
          };
        }
      }
    } catch (error) {
      console.error(`[Groq API] Error generating email for ${recipient.email}:`, error);
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
        subject: parsed.subject || `${senderName} — ${targetRoles} Inquiry | ${company}`,
        body: parsed.body || "",
      };
    } catch (error) {
      console.error(`[Gemini API] Error generating email for ${recipient.email}:`, error);
    }
  }

  // Strategy 3: Intelligent high-converting fallback
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
  const chunkSize = 10;

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
  const recipientName = recipient.name || "Hiring Team";
  const senderName = profile.fullName || "Aditya Gupta";
  const role = profile.currentRole || "Full Stack Developer";
  const skills = profile.skills || "React, TypeScript, Node.js, and Python";
  const targetRoles = profile.targetRoles || "Software Engineer Intern";

  const subject = `${senderName} — ${targetRoles} Inquiry | ${company}`;

  const links = [];
  if (profile.portfolioUrl) links.push(`Portfolio: ${profile.portfolioUrl}`);
  if (profile.githubUrl) links.push(`GitHub: ${profile.githubUrl}`);
  if (profile.linkedinUrl) links.push(`LinkedIn: ${profile.linkedinUrl}`);
  const linksText = links.length > 0 ? `\n\n${links.join(" | ")}` : "";

  const body = `Hi ${recipientName},

I hope you're having a great week.

I've been following ${company}'s work and really admire what your engineering team is building. I am a ${role} with strong hands-on experience building scalable applications using ${skills}.

I am actively exploring ${targetRoles} opportunities where I can contribute to shipping reliable, high-impact features at ${company}.

I have attached my resume for your review. Would you be open to a quick 10-minute conversation this week, or could you point me in the direction of the right engineering lead to speak with?

Thank you for your time and consideration!

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
