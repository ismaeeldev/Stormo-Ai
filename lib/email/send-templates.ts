import fs from 'fs';
import path from 'path';
import { sendEmail } from './sender';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';

function loadTemplate(filename: string, replacements: Record<string, string>): string {
  try {
    const filePath = path.join(process.cwd(), 'lib/email/templates', filename);
    let template = fs.readFileSync(filePath, 'utf8');
    const allReplacements: Record<string, string> = {
      logoUrl: `${baseUrl}/stormo-logo.png`,
      ...replacements,
    };
    Object.keys(allReplacements).forEach((key) => {
      template = template.split(`{${key}}`).join(allReplacements[key]);
    });
    return template;
  } catch (err) {
    console.error(`[Email Template] Error reading template ${filename}:`, err);
    return '';
  }
}

export async function sendWelcomeEmail(to: string, name: string) {
  const dashboardLink = `${baseUrl}/dashboard`;
  const html = loadTemplate('welcome.html', {
    name,
    dashboardLink,
  });

  return sendEmail({
    to,
    subject: 'Welcome to Stormo! Your store is about to get customers.',
    html,
  });
}

export async function sendVerificationEmail(to: string, link: string) {
  const html = loadTemplate('verify-email.html', {
    verificationLink: link,
  });

  return sendEmail({
    to,
    subject: 'Verify your Stormo email address',
    html,
  });
}

export async function sendPasswordResetEmail(to: string, link: string) {
  const html = loadTemplate('password-reset.html', {
    resetLink: link,
  });

  return sendEmail({
    to,
    subject: 'Reset your password',
    html,
  });
}

export async function sendSubscriptionActiveEmail(to: string, name: string) {
  const onboardingLink = `${baseUrl}/onboarding`;
  const html = loadTemplate('subscription-active.html', {
    onboardingLink,
  });

  return sendEmail({
    to,
    subject: "You're in! Let's get your first customer.",
    html,
  });
}

export async function sendPaymentFailedEmail(to: string, retryLink: string) {
  const html = loadTemplate('payment-failed.html', {
    retryLink,
  });

  return sendEmail({
    to,
    subject: 'Action required: your payment failed',
    html,
  });
}

export async function sendSubscriptionCanceledEmail(to: string) {
  const reSubscribeLink = `${baseUrl}/dashboard/settings`;
  const html = loadTemplate('subscription-canceled.html', {
    reSubscribeLink,
  });

  return sendEmail({
    to,
    subject: 'Your subscription has ended',
    html,
  });
}

export async function sendWeeklyContentReadyEmail(to: string, name: string) {
  const dashboardLink = `${baseUrl}/dashboard/content`;
  const html = loadTemplate('weekly-content-ready.html', {
    name,
    dashboardLink,
  });

  return sendEmail({
    to,
    subject: 'Your weekly content is ready!',
    html,
  });
}

export async function sendGrowthUnlockEmail(to: string, name: string) {
  const upgradeLink = `${baseUrl}/dashboard/settings?upgrade=true`;
  const html = loadTemplate('growth-unlock.html', {
    name,
    upgradeLink,
  });

  return sendEmail({
    to,
    subject: "You've reached 10 sales. The Growth plan is now unlocked for you.",
    html,
  });
}

export async function sendMilestoneEmail(to: string, milestone: string, name: string) {
  const dashboardLink = `${baseUrl}/dashboard`;
  let filename = 'milestone-first-action.html';
  let subject = 'First step taken! Keep going.';

  if (milestone === 'first-sale' || milestone === 'first_sale') {
    filename = 'milestone-first-sale.html';
    subject = 'YOU GOT YOUR FIRST SALE! 🎉';
  }

  const html = loadTemplate(filename, {
    name,
    dashboardLink,
  });

  return sendEmail({
    to,
    subject,
    html,
  });
}
