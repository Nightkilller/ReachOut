import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getDbUser } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// Allow up to 10MB file size
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * POST /api/upload — handle resume (PDF/DOCX/Document) attachment upload.
 * Returns { success, path, name, fileName, size, url } of the uploaded file.
 * Resilient to read-only serverless filesystems with automatic base64 fallback.
 */
export async function POST(req: NextRequest) {
  try {
    let authUserId: string | null = null;
    try {
      const authObj = await auth();
      authUserId = authObj?.userId || null;
    } catch {
      // Ignore auth error, will check getDbUser
    }

    if (!authUserId) {
      const user = await getDbUser().catch(() => null);
      if (user) {
        authUserId = user.clerkId || user.id;
      }
    }

    if (!authUserId) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to attach files." },
        { status: 401 }
      );
    }

    let formData: FormData;
    try {
      formData = await req.formData();
    } catch (formErr) {
      console.error("[POST /api/upload] Error parsing formData:", formErr);
      return NextResponse.json(
        { error: "Failed to read uploaded file. Please try again." },
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

    // Convert to buffer & base64 data URI
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = file.type || "application/pdf";
    const base64DataUri = `data:${mimeType};base64,${buffer.toString("base64")}`;

    // Clean safe unique filename
    const originalExt = path.extname(file.name) || ".pdf";
    const cleanExt = originalExt.toLowerCase();
    const rawBase = path.basename(file.name, originalExt);
    const safeBase =
      rawBase.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 40) || "resume";
    const userPrefix = authUserId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10);
    const fileName = `${safeBase}_${userPrefix}_${Date.now()}${cleanExt}`;

    let savedPath = base64DataUri;

    // Try writing to public/uploads or /tmp
    try {
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      await mkdir(uploadDir, { recursive: true });
      const diskPath = path.join(uploadDir, fileName);
      await writeFile(diskPath, buffer);
      savedPath = diskPath;
    } catch {
      try {
        const tmpDir = path.join("/tmp", "uploads");
        await mkdir(tmpDir, { recursive: true });
        const tmpPath = path.join(tmpDir, fileName);
        await writeFile(tmpPath, buffer);
        savedPath = tmpPath;
      } catch {
        // In serverless read-only filesystems, use the base64 Data URI
        savedPath = base64DataUri;
      }
    }

    return NextResponse.json({
      success: true,
      path: savedPath,
      name: file.name,
      fileName,
      size: file.size,
      type: mimeType,
      url: `/uploads/${fileName}`,
    });
  } catch (error) {
    console.error("[POST /api/upload] Unexpected error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: `Upload failed: ${message}` },
      { status: 500 }
    );
  }
}
