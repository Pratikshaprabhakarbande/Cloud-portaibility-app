/**
 * Email service (Nodemailer).
 *
 * Sends transactional emails (password reset) when SMTP env vars are set.
 * Falls back to logging the token to console when no SMTP is configured —
 * preserving the existing demo behavior.
 */
import logger from '../utils/logger.js';

let transporter = null;

async function getTransporter() {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  if (!host) return null;
  try {
    const nodemailer = await import('nodemailer');
    transporter = nodemailer.default.createTransport({
      host,
      port: parseInt(port, 10) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    return transporter;
  } catch (err) {
    logger.warn(`[email] nodemailer unavailable: ${err.message}`);
    return null;
  }
}

/**
 * Send a password-reset email. Falls back to console log when SMTP is unconfigured.
 * @returns {boolean} true if email was sent, false if fallback was used.
 */
export async function sendResetEmail({ to, resetToken, resetUrl }) {
  const t = await getTransporter();
  if (!t) {
    logger.info(`[email] SMTP not configured; reset token for ${to}: ${resetToken}`);
    return false;
  }
  const from = process.env.SMTP_FROM || 'noreply@cloudportability.dev';
  const link = resetUrl || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
  await t.sendMail({
    from,
    to,
    subject: 'Password Reset — Cloud Portability Platform',
    text: `You requested a password reset.\n\nUse this link (expires in 15 minutes):\n${link}\n\nIf you didn't request this, ignore this email.`,
    html: `<p>You requested a password reset.</p><p><a href="${link}">Reset your password</a> (expires in 15 minutes).</p><p>If you didn't request this, ignore this email.</p>`
  });
  logger.info(`[email] reset email sent to ${to}`);
  return true;
}

export default { sendResetEmail };
