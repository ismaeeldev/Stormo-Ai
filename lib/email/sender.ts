import nodemailer from 'nodemailer';

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  try {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.SMTP_FROM || user || 'no-reply@stormo.io';

    if (!host || !user || !pass) {
      console.warn('[Email Sender] Missing SMTP configuration. Email send bypassed.');
      return;
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });

    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });

    console.log(`[Email Sender] Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`[Email Sender] Failed to send email to ${to}:`, error);
  }
}
