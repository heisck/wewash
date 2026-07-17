import { APP_NAME, AUTH_OTP } from "@/lib/config/constants";
import { sendEmail } from "./mailer";

export type OtpEmailType =
  | "sign-in"
  | "email-verification"
  | "forget-password"
  | "change-email";

const SUBJECTS: Record<OtpEmailType, string> = {
  "sign-in": `${APP_NAME} sign-in code`,
  "email-verification": `${APP_NAME} email verification code`,
  "forget-password": `${APP_NAME} password reset code`,
  "change-email": `${APP_NAME} email change code`,
};

const INTROS: Record<OtpEmailType, string> = {
  "sign-in": "Use this code to sign in to your account.",
  "email-verification": "Use this code to verify your email address.",
  "forget-password": "Use this code to reset your password.",
  "change-email": "Use this code to confirm your email change.",
};

/**
 * Send a one-time code by email (Gmail SMTP).
 * Never log the OTP value.
 */
export async function sendOtpEmail(params: {
  email: string;
  otp: string;
  type: OtpEmailType;
}): Promise<void> {
  const { email, otp, type } = params;
  const expiryMinutes = Math.ceil(AUTH_OTP.EXPIRES_IN_SECONDS / 60);
  const subject = SUBJECTS[type];
  const intro = INTROS[type];

  const text = [
    `Your ${APP_NAME} verification code is: ${otp}`,
    "",
    intro,
    `This code expires in ${expiryMinutes} minutes.`,
    "Do not share this code with anyone.",
    "",
    `If you did not request this, you can ignore this email.`,
    `— ${APP_NAME}`,
  ].join("\n");

  const html = `
<!DOCTYPE html>
<html>
  <body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #0f172a;">
    <p style="font-size: 16px; margin: 0 0 12px;">${intro}</p>
    <p style="font-size: 28px; font-weight: 800; letter-spacing: 0.25em; margin: 16px 0; color: #0f766e;">
      ${otp}
    </p>
    <p style="font-size: 14px; color: #475569; margin: 0 0 8px;">
      Expires in <strong>${expiryMinutes} minutes</strong>. Do not share this code.
    </p>
    <p style="font-size: 12px; color: #94a3b8; margin: 24px 0 0;">
      If you did not request this, ignore this email.<br/>— ${APP_NAME}
    </p>
  </body>
</html>`.trim();

  await sendEmail({ to: email, subject, text, html });
}
