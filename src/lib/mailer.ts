/**
 * Nodemailer SMTP transport for sending emails via Gmail App Password.
 * Each user stores their own Gmail address + App Password (encrypted).
 */

import nodemailer from "nodemailer";
import type Mail from "nodemailer/lib/mailer";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";
import fs from "fs";
import path from "path";
import dns from "dns";

// Force IPv4 lookup by default to prevent ENETUNREACH on IPv6-unrouted networks
try {
  dns.setDefaultResultOrder?.("ipv4first");
} catch {
  // Ignore in older Node environments
}

/**
 * Custom DNS lookup that forces IPv4 (family: 4) resolution.
 * Fixes ENETUNREACH errors when Node attempts to connect to Gmail's IPv6 address.
 */
function ipv4Lookup(
  hostname: string,
  options: any,
  callback: (
    err: NodeJS.ErrnoException | null,
    address: string,
    family: number
  ) => void
) {
  if (typeof options === "function") {
    callback = options;
    return dns.lookup(hostname, { family: 4 }, callback);
  }
  return dns.lookup(hostname, { ...options, family: 4 }, callback);
}

/**
 * Get an authenticated Nodemailer transport for a given user.
 * Fetches the encrypted SMTP password from DB, decrypts it,
 * and returns a ready-to-use transporter.
 */
export async function getMailTransport(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      smtpEmail: true,
      smtpPassword: true,
    },
  });

  if (!user.smtpEmail || !user.smtpPassword) {
    throw new Error(
      "Gmail SMTP not configured — please go to Settings and add your Gmail address and 16-character App Password"
    );
  }

  const decryptedPassword = decrypt(user.smtpPassword).trim().replace(/\s+/g, "");

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: user.smtpEmail.trim(),
      pass: decryptedPassword,
    },
    lookup: ipv4Lookup,
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 15000,
  } as any);
}

/**
 * Get the sender email for a given user.
 */
export async function getSenderEmail(userId: string): Promise<string> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { smtpEmail: true, email: true },
  });

  return user.smtpEmail || user.email;
}

interface SendMailOptions {
  from: string;
  to: string;
  subject: string;
  html: string;
  attachmentPath?: string | null;
  attachmentName?: string | null;
}

/**
 * Send a single email using Nodemailer.
 */
export async function sendEmail(
  transporter: nodemailer.Transporter,
  options: SendMailOptions
) {
  const mailOptions: Mail.Options = {
    from: options.from,
    to: options.to,
    subject: options.subject,
    html: options.html,
  };

  // Add attachment if provided
  if (options.attachmentPath) {
    const resolvedPath = path.isAbsolute(options.attachmentPath)
      ? options.attachmentPath
      : path.join(process.cwd(), options.attachmentPath);

    if (fs.existsSync(resolvedPath)) {
      const fileName =
        options.attachmentName || path.basename(resolvedPath);
      mailOptions.attachments = [
        {
          filename: fileName,
          path: resolvedPath,
        },
      ];
    }
  }

  return transporter.sendMail(mailOptions);
}

/**
 * Test SMTP connection for a given email and password.
 * Returns true if connection is successful.
 */
export async function testSmtpConnection(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim().replace(/\s+/g, "");

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: cleanEmail,
        pass: cleanPassword,
      },
      lookup: ipv4Lookup,
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 15000,
    } as any);

    await transporter.verify();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to connect to Gmail SMTP",
    };
  }
}
