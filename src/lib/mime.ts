/**
 * MIME utilities for email content processing.
 * Merge tag replacement for template-based emails.
 */

interface MergeData {
  email: string;
  name?: string | null;
  company?: string | null;
}

/**
 * Replace merge tags in text with recipient data.
 * Supported tags: {{name}}, {{company}}, {{email}}
 * Missing values are replaced with empty string.
 */
export function applyMergeTags(template: string, data: MergeData): string {
  return template
    .replace(/\{\{name\}\}/gi, data.name ?? "")
    .replace(/\{\{company\}\}/gi, data.company ?? "")
    .replace(/\{\{email\}\}/gi, data.email);
}
