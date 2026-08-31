/**
 * Email Humanizer — Makes each template email slightly unique.
 *
 * Gmail's spam detection flags identical emails sent to many recipients.
 * This module adds subtle, invisible variations so each email is technically
 * unique while appearing the same to the human reader.
 *
 * Techniques used:
 * 1. Zero-width characters inserted at random positions (invisible to readers)
 * 2. Random greeting variants ("Hi", "Hello", "Hey")
 * 3. Random sign-off variants ("Best regards", "Thanks", "Warm regards")
 * 4. Subtle whitespace variation in HTML
 */

// Zero-width characters that are invisible in email clients
const ZERO_WIDTH_CHARS = [
  "\u200B", // Zero-width space
  "\u200C", // Zero-width non-joiner
  "\u200D", // Zero-width joiner
  "\uFEFF", // Zero-width no-break space
];

const GREETING_VARIANTS = [
  "Hi",
  "Hello",
  "Hey",
  "Dear",
  "Greetings",
];

const SIGNOFF_VARIANTS = [
  "Best regards",
  "Best",
  "Thanks",
  "Thank you",
  "Warm regards",
  "Kind regards",
  "Regards",
  "Cheers",
];

/**
 * Pick a random item from an array.
 */
function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Insert 2-4 invisible zero-width characters at random positions in the HTML.
 * These are completely invisible to recipients but make each email unique
 * to Gmail's duplicate content detector.
 */
function insertZeroWidthChars(html: string): string {
  const insertCount = 2 + Math.floor(Math.random() * 3); // 2 to 4 insertions
  let result = html;

  for (let i = 0; i < insertCount; i++) {
    // Find a random position that's inside text content (not inside HTML tags)
    const textSegments: { start: number; end: number }[] = [];
    let inTag = false;
    let segStart = 0;

    for (let j = 0; j < result.length; j++) {
      if (result[j] === "<") {
        if (!inTag && j > segStart) {
          textSegments.push({ start: segStart, end: j });
        }
        inTag = true;
      } else if (result[j] === ">") {
        inTag = false;
        segStart = j + 1;
      }
    }
    if (!inTag && segStart < result.length) {
      textSegments.push({ start: segStart, end: result.length });
    }

    // Pick a random text segment and insert a zero-width char
    const validSegments = textSegments.filter((s) => s.end - s.start > 3);
    if (validSegments.length > 0) {
      const seg = randomPick(validSegments);
      const insertPos = seg.start + 1 + Math.floor(Math.random() * (seg.end - seg.start - 2));
      const zwc = randomPick(ZERO_WIDTH_CHARS);
      result = result.slice(0, insertPos) + zwc + result.slice(insertPos);
    }
  }

  return result;
}

/**
 * Randomly vary the greeting in the email body.
 * Replaces common greetings like "Hi {{name}}" with a random variant.
 */
function varyGreeting(html: string): string {
  const greeting = randomPick(GREETING_VARIANTS);
  // Match common greeting patterns at the start of the email
  return html.replace(
    /^(Hi|Hello|Hey|Dear|Greetings)\b/i,
    greeting
  );
}

/**
 * Randomly vary the sign-off in the email body.
 */
function varySignoff(html: string): string {
  const signoff = randomPick(SIGNOFF_VARIANTS);
  // Match common sign-offs
  return html.replace(
    /(Best regards|Best|Thanks|Thank you|Warm regards|Kind regards|Regards|Cheers)([,.]?\s*<br>|\s*\n)/i,
    `${signoff}$2`
  );
}

/**
 * Add subtle HTML whitespace variation.
 * Randomly add or remove a trailing space, vary line breaks, etc.
 */
function varyWhitespace(html: string): string {
  // Randomly add a space before some closing tags
  if (Math.random() > 0.5) {
    html = html.replace(/<\/p>/i, " </p>");
  }

  // Randomly add an invisible comment with a unique ID
  const uid = Math.random().toString(36).slice(2, 8);
  html = html + `<!-- ${uid} -->`;

  return html;
}

/**
 * Main humanizer function.
 * Takes an email HTML body and returns a subtly modified version
 * that appears identical to the reader but is technically unique content.
 *
 * @param html - The email body HTML content
 * @param options - Control which humanization techniques to apply
 */
export function humanizeEmail(
  html: string,
  options: {
    varyGreetings?: boolean;
    varySignoffs?: boolean;
    insertInvisibleChars?: boolean;
    varyWhitespace?: boolean;
  } = {}
): string {
  const {
    varyGreetings = true,
    varySignoffs = true,
    insertInvisibleChars = true,
    varyWhitespace: doVaryWhitespace = true,
  } = options;

  let result = html;

  if (varyGreetings) {
    result = varyGreeting(result);
  }

  if (varySignoffs) {
    result = varySignoff(result);
  }

  if (insertInvisibleChars) {
    result = insertZeroWidthChars(result);
  }

  if (doVaryWhitespace) {
    result = varyWhitespace(result);
  }

  return result;
}
