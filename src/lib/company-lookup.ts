/**
 * Company and Name extraction utilities from email domains and addresses.
 */

// Public / Personal email domains to ignore for company detection
const PUBLIC_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.in",
  "yahoo.co.uk",
  "hotmail.com",
  "outlook.com",
  "live.com",
  "msn.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "proton.me",
  "protonmail.com",
  "aol.com",
  "zoho.com",
  "mail.com",
  "gmx.com",
  "yandex.com",
  "fastmail.com",
  "tutanota.com",
  "hey.com",
]);

// Well-known domain to canonical company name mapping
const KNOWN_COMPANY_DOMAINS: Record<string, string> = {
  "amazon.com": "Amazon",
  "amazon.in": "Amazon",
  "amazon.co.uk": "Amazon",
  "google.com": "Google",
  "alphabet.com": "Alphabet",
  "meta.com": "Meta",
  "fb.com": "Meta",
  "apple.com": "Apple",
  "microsoft.com": "Microsoft",
  "netflix.com": "Netflix",
  "uber.com": "Uber",
  "airbnb.com": "Airbnb",
  "stripe.com": "Stripe",
  "salesforce.com": "Salesforce",
  "openai.com": "OpenAI",
  "anthropic.com": "Anthropic",
  "nvidia.com": "NVIDIA",
  "tesla.com": "Tesla",
  "spotify.com": "Spotify",
  "adobe.com": "Adobe",
  "oracle.com": "Oracle",
  "ibm.com": "IBM",
  "intel.com": "Intel",
  "cisco.com": "Cisco",
  "datadoghq.com": "Datadog",
  "datadog.com": "Datadog",
  "snowflake.com": "Snowflake",
  "palantir.com": "Palantir",
  "coinbase.com": "Coinbase",
  "bytedance.com": "ByteDance",
  "tiktok.com": "TikTok",
  "atlassian.com": "Atlassian",
  "figma.com": "Figma",
  "notion.so": "Notion",
  "linear.app": "Linear",
  "vercel.com": "Vercel",
  "supabase.com": "Supabase",
  "cloudflare.com": "Cloudflare",
  "twosigma.com": "Two Sigma",
  "janestreet.com": "Jane Street",
  "citadel.com": "Citadel",
  "de-shaw.com": "D. E. Shaw",
  "deshaw.com": "D. E. Shaw",
  "goldmansachs.com": "Goldman Sachs",
  "gs.com": "Goldman Sachs",
  "morganstanley.com": "Morgan Stanley",
  "jpmorgan.com": "JPMorgan Chase",
  "jpmchase.com": "JPMorgan Chase",
  "mckinsey.com": "McKinsey & Company",
  "bcg.com": "Boston Consulting Group (BCG)",
  "bain.com": "Bain & Company",
  "deloitte.com": "Deloitte",
  "pwc.com": "PwC",
  "ey.com": "EY",
  "kpmg.com": "KPMG",
  "walmart.com": "Walmart",
  "target.com": "Target",
  "flipkart.com": "Flipkart",
  "swiggy.in": "Swiggy",
  "zomato.com": "Zomato",
  "razorpay.com": "Razorpay",
  "cred.club": "CRED",
  "ola.in": "Ola",
  "olacabs.com": "Ola",
  "zepto.com": "Zepto",
  "blinkit.com": "Blinkit",
  "postman.com": "Postman",
  "browserstack.com": "BrowserStack",
  "twilio.com": "Twilio",
  "zoom.us": "Zoom",
  "slack.com": "Slack",
  "github.com": "GitHub",
  "gitlab.com": "GitLab",
  "hubspot.com": "HubSpot",
  "dropbox.com": "Dropbox",
  "box.com": "Box",
  "square.com": "Block (Square)",
  "squareup.com": "Block (Square)",
  "block.xyz": "Block",
  "robinhood.com": "Robinhood",
  "plaid.com": "Plaid",
  "brex.com": "Brex",
  "ramp.com": "Ramp",
  "scale.com": "Scale AI",
  "scaleai.com": "Scale AI",
  "huggingface.co": "Hugging Face",
  "mistral.ai": "Mistral AI",
  "perplexity.ai": "Perplexity AI",
  "cursor.sh": "Cursor / Anysphere",
  "anysphere.co": "Anysphere",
  "deepmind.com": "Google DeepMind",
  "google.org": "Google",
};

/**
 * Extract clean company name from an email address.
 * Examples:
 *   - "sundar@google.com" -> "Google"
 *   - "alex@amazon.co.uk" -> "Amazon"
 *   - "recruiter@acme-technologies.io" -> "Acme Technologies"
 *   - "john@gmail.com" -> null
 */
export function getCompanyFromEmail(email: string): string | null {
  if (!email || !email.includes("@")) return null;

  const parts = email.trim().toLowerCase().split("@");
  if (parts.length !== 2) return null;

  let domain = parts[1];

  // If it's a public email provider, don't guess company
  if (PUBLIC_EMAIL_DOMAINS.has(domain)) {
    return null;
  }

  // Check known dictionary first
  if (KNOWN_COMPANY_DOMAINS[domain]) {
    return KNOWN_COMPANY_DOMAINS[domain];
  }

  // Strip common email subdomains (e.g. mail.acme.com -> acme.com)
  const subDomainPrefixes = ["mail.", "email.", "corp.", "internal.", "in.", "us.", "uk.", "eu.", "apac.", "dev."];
  for (const prefix of subDomainPrefixes) {
    if (domain.startsWith(prefix)) {
      domain = domain.slice(prefix.length);
      if (KNOWN_COMPANY_DOMAINS[domain]) {
        return KNOWN_COMPANY_DOMAINS[domain];
      }
      break;
    }
  }

  // Heuristic cleanup for custom domains:
  // Remove known TLD extensions
  const cleanDomain = domain
    .replace(/\.(co\.[a-z]{2,3}|com\.[a-z]{2,3}|org\.[a-z]{2,3}|net\.[a-z]{2,3})$/i, "")
    .replace(/\.(com|org|net|io|ai|co|app|dev|sh|tech|in|me|xyz|ca|de|fr|uk|us|club|so|co\.in)$/i, "");

  if (!cleanDomain) return null;

  // Split hyphen, underscore, or period
  const words = cleanDomain.split(/[-_.]+/).filter(Boolean);
  if (words.length === 0) return null;

  const formattedWords = words.map((w) => {
    // Acronyms / short tech terms
    const upper = w.toUpperCase();
    if (["AI", "ML", "HQ", "IT", "HR", "IO", "API", "SaaS", "DB"].includes(upper)) {
      return upper;
    }
    return w.charAt(0).toUpperCase() + w.slice(1);
  });

  return formattedWords.join(" ");
}

/**
 * Infer recipient's full name from email username if missing.
 * Examples:
 *   - "john.doe@amazon.com" -> "John Doe"
 *   - "aditya_gupta@google.com" -> "Aditya Gupta"
 *   - "jane-smith@meta.com" -> "Jane Smith"
 */
export function inferNameFromEmail(email: string): string | null {
  if (!email || !email.includes("@")) return null;

  const username = email.trim().split("@")[0];
  if (!username) return null;

  // If username has digits at end (like john123), strip them for cleaner name
  const cleanUsername = username.replace(/[0-9]+$/, "");

  // Split by dot, underscore, or hyphen
  const parts = cleanUsername.split(/[._-]+/).filter((p) => p.length > 1);

  // If it's a realistic first + last (e.g. john.doe)
  if (parts.length >= 2 && parts.length <= 3) {
    return parts
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
      .join(" ");
  }

  // If single word but capitalized, ensure it's not a generic department/inbox
  if (
    parts.length === 1 &&
    parts[0].length >= 3 &&
    !/^(info|contact|support|careers|recruiting|admin|team|hello|press|jobs|dev|sales|marketing|billing|office|hr|general)$/i.test(
      parts[0]
    )
  ) {
    return parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
  }

  return null;
}
