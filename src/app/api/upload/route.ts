import { NextRequest, NextResponse } from "next/server";
import { getDbUser } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// Allow up to 10MB file size
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

// Supported document extensions
const ALLOWED_EXTENSIONS = new Set([".pdf", ".docx", ".doc", ".txt", ".rtf"]);

// Supported MIME types (including variations across different operating systems/browsers)
const ALLOWED_MIME_PATTERNS = [
  "application/pdf",
  "application/x-pdf",
  "application/acrobat",
  "applications/vnd.pdf",
  "text/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "application/rtf",
  "application/octet-stream", // Some browsers/operating systems report this for PDFs and Word docs
];

function isAllowedFile(fileName: string, mimeType?: string | null): boolean {
  const ext = path.extname(fileName || "").toLowerCase();
  if (ALLOWED_EXTENSIONS.has(ext)) {
    return true;
  }
  if (mimeType) {
    const cleanMime = mimeType.toLowerCase();
    if (ALLOWED_MIME_PATTERNS.some((p) => cleanMime.includes(p))) {
      return true;
    }
  }
  return false;
}

/**
 * POST /api/upload — handle resume (PDF/DOCX) attachment upload.
 * Returns { success, path, name, fileName, size, url } of the uploaded file.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getDbUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to upload attachments." },
        { status: 401 }
      );
    }

    let formData: FormData;
    try {
      formData = await req.formData();
    } catch (formErr) {
      console.error("[POST /api/upload] Error parsing formData:", formErr);
      return NextResponse.json(
        { error: "Failed to read uploaded file payload. Please try again." },
        { status: 400 }
      );
    }

    const file = formData.get("file") as File | null;

    if (!file || typeof file === "string" || !file.name) {
      return NextResponse.json(
        { error: "No valid file was provided in the request." },
        { status: 400 }
      );
    }

    // Validate file type
    if (!isAllowedFile(file.name, file.type)) {
      return NextResponse.json(
        {
          error: `Invalid file type for "${file.name}". Please upload a PDF or document file (.pdf, .docx, .doc).`,
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_SIZE) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      return NextResponse.json(
        {
          error: `File is too large (${sizeMb}MB). Maximum allowed size is 10MB.`,
        },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { error: "The uploaded file is empty (0 bytes)." },
        { status: 400 }
      );
    }

    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    // Generate clean, safe unique filename
    const originalExt = path.extname(file.name) || ".pdf";
    const cleanExt = originalExt.toLowerCase();
    const rawBase = path.basename(file.name, originalExt);
    const safeBase =
      rawBase.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 40) || "resume";
    const userPrefix = (user.id || "user").replace(/[^a-zA-Z0-9]/g, "").slice(0, 10);
    const fileName = `${safeBase}_${userPrefix}_${Date.now()}${cleanExt}`;
    const filePath = path.join(uploadDir, fileName);

    // Write file to disk
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await writeFile(filePath, buffer);

    return NextResponse.json({
      success: true,
      path: filePath,
      name: file.name,
      fileName,
      size: file.size,
      type: file.type || "application/pdf",
      url: `/uploads/${fileName}`,
    });
  } catch (error) {
    console.error("[POST /api/upload] Unexpected error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: `Upload failed: ${message}` },
      { status: 500 }
    );
  }
}
