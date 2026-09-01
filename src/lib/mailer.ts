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
    connectionTimeout: 15000,
    greetingTimeout: 15000,
  });
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
      connectionTimeout: 15000,
      greetingTimeout: 15000,
    });

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
