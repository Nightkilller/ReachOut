/**
 * Simple CSV parser for recipient imports.
 * Handles both CSV format (email,name,company) and plain email lists.
 */

export interface ParsedRecipient {
  email: string;
  name?: string;
  company?: string;
}

/**
 * Parse CSV text into an array of recipients.
 * Accepts:
 *   - CSV with headers: email,name,company
 *   - Plain list: one email per line
 *   - Mixed: "name,email,company" per line (no header)
 */
export function parseCSV(text: string): ParsedRecipient[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  // Check if first line is a header row
  const firstLine = lines[0].toLowerCase();
  const hasHeader =
    firstLine.includes("email") ||
    firstLine.includes("name") ||
    firstLine.includes("company");

  const dataLines = hasHeader ? lines.slice(1) : lines;

  // Detect columns from header
  let emailIdx = 0;
  let nameIdx = 1;
  let companyIdx = 2;

  if (hasHeader) {
    const headers = firstLine.split(",").map((h) => h.trim().toLowerCase());
    emailIdx = headers.indexOf("email");
    nameIdx = headers.indexOf("name");
    companyIdx = headers.indexOf("company");

    // If no email column found, default to first column
    if (emailIdx === -1) emailIdx = 0;
  }

  const recipients: ParsedRecipient[] = [];
  const seen = new Set<string>();

  for (const line of dataLines) {
    // Handle CSV with commas
    const parts = parseCSVLine(line);

    if (parts.length === 1) {
      // Plain email
      const email = parts[0].trim().toLowerCase();
      if (isValidEmail(email) && !seen.has(email)) {
        seen.add(email);
        recipients.push({ email });
      }
    } else {
      // CSV row
      const email = (parts[emailIdx] ?? "").trim().toLowerCase();
      const name = nameIdx >= 0 ? (parts[nameIdx] ?? "").trim() : undefined;
      const company =
        companyIdx >= 0 ? (parts[companyIdx] ?? "").trim() : undefined;

      if (isValidEmail(email) && !seen.has(email)) {
        seen.add(email);
        recipients.push({
          email,
          name: name || undefined,
          company: company || undefined,
        });
      }
    }
  }

  return recipients;
}

/**
 * Parse a single CSV line, respecting quoted fields.
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }
  }

  result.push(current);
  return result;
}

/**
 * Basic email validation.
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
