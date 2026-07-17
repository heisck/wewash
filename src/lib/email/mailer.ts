import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { env } from "@/lib/config/env";
import { AppError, ErrorCode } from "@/lib/errors";
import { logger } from "@/lib/logger";

const mailLogger = logger.child({ service: "email" });

let transporter: Transporter | null = null;

function isSmtpConfigured(): boolean {
  return Boolean(env.SMTP_USER && env.SMTP_PASS);
}

function getTransporter(): Transporter {
  if (!isSmtpConfigured()) {
    throw new AppError(
      ErrorCode.SERVICE_UNAVAILABLE,
      "Email is not configured. Set SMTP_USER and SMTP_PASS (Gmail app password) in .env."
    );
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE, // true for 465, false for 587 (STARTTLS)
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  }

  return transporter;
}

export type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

/**
 * Send email via Gmail SMTP (or any SMTP host in env).
 * Uses an App Password when host is smtp.gmail.com — never the account password.
 */
export async function sendEmail(input: SendEmailInput): Promise<void> {
  const transport = getTransporter();
  const from = env.SMTP_FROM || env.SMTP_USER;

  try {
    const info = await transport.sendMail({
      from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html ?? input.text.replace(/\n/g, "<br/>"),
    });

    mailLogger.info(
      { to: input.to, messageId: info.messageId, subject: input.subject },
      "Email sent"
    );
  } catch (error) {
    mailLogger.error({ err: error, to: input.to }, "Email send failed");
    throw new AppError(ErrorCode.OTP_SEND_FAILED, "Failed to send email", {
      cause: error instanceof Error ? error : undefined,
    });
  }
}

export function emailServiceReady(): boolean {
  return isSmtpConfigured();
}
