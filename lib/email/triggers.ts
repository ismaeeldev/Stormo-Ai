/**
 * lib/email/triggers.ts
 * One exported function per behavioral event. Each function is called from
 * the relevant API route at the exact moment the event occurs.
 * All sending goes through sendEmail() in sender.ts via Nodemailer.
 * Every email uses brandedEmail() from layout.ts — same header, logo, and
 * footer as welcome.html so the design is 100% consistent.
 */

import { sendEmail } from './sender';
import { sendMilestoneEmail, sendGrowthUnlockEmail } from './send-templates';
import { brandedEmail, ctaButton, h1, p, ul, highlightBox, statGrid } from './layout';

const baseUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXTAUTH_URL ||
  'http://localhost:3000';

// ─── Onboarding ──────────────────────────────────────────────────────────────

/** Called from: app/api/onboarding/complete/route.ts */
export async function triggerOnboardingComplete(email: string, name: string) {
  return sendEmail({
    to: email,
    subject: 'Your plan is ready. Here is your first action.',
    html: brandedEmail(`
      ${h1(`Your plan is ready, ${name}.`)}
      ${p('Your personalised acquisition plan is live. Head to your dashboard to see your first daily action — one focused task chosen specifically for your store.')}
      ${p('Each action takes under 30 minutes and is designed around what actually works for stores like yours.')}
      ${ctaButton('Open your dashboard →', `${baseUrl}/dashboard`)}
    `),
  });
}

// ─── Action milestones ────────────────────────────────────────────────────────

/**
 * Called from: app/api/actions/generate/route.ts
 * Condition: total action count for this user just became 1
 */
export async function triggerFirstActionAssigned(
  email: string,
  name: string,
  actionTitle: string
) {
  return sendEmail({
    to: email,
    subject: 'Your first action is ready.',
    html: brandedEmail(`
      ${h1(`Your first action is ready, ${name}.`)}
      ${p(`Today's task: <strong style="color: #1A1A1A;">${actionTitle}</strong>`)}
      ${p('Each action is chosen based on your store, your audience, and your available time. Complete it today and your next one will be ready tomorrow.')}
      ${ctaButton('View your action →', `${baseUrl}/dashboard`)}
    `),
  });
}

/**
 * Called from: app/api/actions/[id]/complete/route.ts
 * Condition: completed action count for this user just became 1
 * Delegates to the existing milestone-first-action.html template.
 */
export async function triggerFirstActionCompleted(email: string, name: string) {
  return sendMilestoneEmail(email, 'first-action', name);
}

// ─── Sales milestones ─────────────────────────────────────────────────────────

/**
 * Called from: app/api/sales/route.ts
 * Condition: totalSales just became 1
 * Delegates to the existing milestone-first-sale.html template.
 */
export async function triggerFirstSaleLogged(email: string, name: string) {
  return sendMilestoneEmail(email, 'first-sale', name);
}

/**
 * Called from: app/api/sales/route.ts
 * Condition: totalSales just became 5
 */
export async function triggerFiveSalesLogged(email: string, name: string) {
  return sendEmail({
    to: email,
    subject: 'Halfway to Growth. Here is what unlocks at 10 sales.',
    html: brandedEmail(`
      ${h1(`Halfway there, ${name}. 5 sales logged.`)}
      ${p('You are halfway to unlocking the Growth plan. At 10 sales, you will get access to:')}
      ${ul([
        'Paid advertising guidance (Meta Ads, Google Ads basics)',
        'Advanced influencer outreach strategies and templates',
        'Deeper AI insights with competitive analysis',
        'Priority support response time',
      ])}
      ${highlightBox('Keep taking one action per day. You are on track.', '#10B981')}
      ${ctaButton("See today's action →", `${baseUrl}/dashboard`)}
    `),
  });
}

/**
 * Called from: app/api/sales/route.ts
 * Condition: totalSales just became 10 (Growth unlocked)
 * Delegates to the existing growth-unlock.html template.
 */
export async function triggerGrowthUnlocked(email: string, name: string) {
  return sendGrowthUnlockEmail(email, name);
}

// ─── Trial conversion ─────────────────────────────────────────────────────────

/**
 * Called from: app/api/cron/trial-reminders/route.ts
 * daysLeft: number of days remaining in the trial (15, 3, or 1)
 */
export async function triggerTrialEnding(
  email: string,
  name: string,
  daysLeft: number
) {
  const urgency =
    daysLeft <= 1
      ? 'Your trial ends tomorrow.'
      : daysLeft <= 3
      ? `Your trial ends in ${daysLeft} days.`
      : `Your trial has ${daysLeft} days remaining.`;

  const accentColor = daysLeft <= 1 ? '#E8621A' : daysLeft <= 3 ? '#F59E0B' : '#10B981';

  return sendEmail({
    to: email,
    subject: `${urgency} Continue for $29/month.`,
    html: brandedEmail(`
      ${h1(`${urgency}`)}
      ${highlightBox(`Hi ${name}, after your trial ends you will be billed $29/month to continue your Stormo plan.`, accentColor as any)}
      ${p('To keep your personalised daily actions, progress tracking, and everything you have built — stay subscribed. Cancel anytime from your settings page.')}
      ${ctaButton('Manage your subscription →', `${baseUrl}/dashboard/settings`)}
    `),
  });
}

/**
 * Called from: app/api/cron/trial-reminders/route.ts
 * Condition: user joined exactly 30 days ago
 */
export async function triggerMonthlyMilestone(
  email: string,
  name: string,
  daysAsMember: number
) {
  return sendEmail({
    to: email,
    subject: 'Your first month with Stormo.',
    html: brandedEmail(`
      ${h1(`${daysAsMember} days in, ${name}.`)}
      ${p(`You have been a Stormo member for <strong style="color: #E8621A;">${daysAsMember} days</strong>. Every action you have taken has been building toward your first consistent revenue stream.`)}
      ${highlightBox('The compounding effect of daily actions is starting to take hold. Keep going.', '#10B981')}
      ${ctaButton('See your progress →', `${baseUrl}/dashboard`)}
    `),
  });
}

// ─── Re-engagement ────────────────────────────────────────────────────────────

/** Called from: app/api/cron/daily-actions/route.ts — no login for 3 days */
export async function triggerInactiveDay3(email: string, name: string) {
  return sendEmail({
    to: email,
    subject: 'Your daily actions are waiting.',
    html: brandedEmail(`
      ${h1(`Hi ${name}, your actions are waiting.`)}
      ${p('Your Stormo plan is still active and your next action is ready. It only takes a few minutes to stay on track.')}
      ${p('Consistency is what separates stores that grow from stores that stall — one action per day adds up fast.')}
      ${ctaButton("See today's action →", `${baseUrl}/dashboard`)}
    `),
  });
}

/** Called from: app/api/cron/daily-actions/route.ts — no login for 7 days */
export async function triggerInactiveDay7(email: string, name: string) {
  return sendEmail({
    to: email,
    subject: 'It has been a week. Here is a quick win to get back on track.',
    html: brandedEmail(`
      ${h1(`It has been a week, ${name}.`)}
      ${p('Your plan and all your data are still here — nothing was lost.')}
      ${highlightBox("Today's action will take under 30 minutes. One small step is all it takes to rebuild momentum.", '#F59E0B')}
      ${ctaButton('Open Stormo →', `${baseUrl}/dashboard`)}
    `),
  });
}

/** Called from: app/api/cron/daily-actions/route.ts — no login for 14 days */
export async function triggerInactiveDay14(email: string, name: string) {
  return sendEmail({
    to: email,
    subject: 'Final check-in. Your store data is still here.',
    html: brandedEmail(`
      ${h1(`Final check-in, ${name}.`)}
      ${p('This is our last check-in for now. We will not keep nudging you after this.')}
      ${p('Your Stormo plan, your action history, and all your data are still intact whenever you are ready to come back. No need to start over.')}
      ${ctaButton('Come back to Stormo →', `${baseUrl}/dashboard`)}
    `),
  });
}

// ─── Cancellation ────────────────────────────────────────────────────────────

/** Called from: app/api/billing/cancel/route.ts — fires immediately when user clicks cancel */
export async function triggerCancellationScheduled(
  email: string,
  name: string,
  accessUntil: string
) {
  return sendEmail({
    to: email,
    subject: 'Your Stormo subscription is scheduled to end',
    html: brandedEmail(`
      ${h1(`Subscription ending, ${name}.`)}
      ${p(`We have received your cancellation. Your subscription is scheduled to end on <strong style="color: #1A1A1A;">${accessUntil}</strong>.`)}
      ${highlightBox(`You keep full access to Stormo until ${accessUntil} — nothing changes until then.`, '#F59E0B')}
      ${p('If you change your mind, you can reactivate anytime from your settings page before the end date.')}
      ${ctaButton('Manage subscription →', `${baseUrl}/dashboard/settings`)}
    `),
  });
}

/** Called from: app/api/cron/trial-reminders/route.ts — 7 days after subscription ends */
export async function triggerCancellationReEngagement(
  email: string,
  name: string
) {
  return sendEmail({
    to: email,
    subject: 'Is there anything Stormo could have done better?',
    html: brandedEmail(`
      ${h1(`We want to do better, ${name}.`)}
      ${p('We noticed you cancelled your Stormo subscription. We genuinely want to improve — your feedback matters to us.')}
      ${highlightBox('Reply to this email and tell us: what did not work for you? What would have made Stormo worth staying?', '#E8621A')}
      ${p('Your data is still saved. If you ever want to come back, everything is ready and waiting — no need to start from scratch.')}
      ${ctaButton('Come back to Stormo →', `${baseUrl}/dashboard`)}
    `),
  });
}

// ─── Weekly Summary ───────────────────────────────────────────────────────────

/**
 * Called from: app/api/cron/weekly-summary/route.ts
 * Sends the Monday weekly recap email.
 */
export async function triggerWeeklySummary(
  email: string,
  name: string,
  params: {
    weekRange: string;
    actionsCompleted: number;
    streak: number;
    totalSales: number;
    topChannel: string;
    resultsHighlight: string | null;
    salesProgressText: string;
    encouragingMessage: string;
  }
) {
  const {
    weekRange,
    actionsCompleted,
    streak,
    totalSales,
    topChannel,
    resultsHighlight,
    salesProgressText,
    encouragingMessage,
  } = params;

  return sendEmail({
    to: email,
    subject: `Your week at a glance — ${weekRange}`,
    html: brandedEmail(`
      ${h1(`Your week at a glance, ${name}.`)}
      ${p(weekRange)}
      ${statGrid([
        { label: 'Actions Done', value: String(actionsCompleted) },
        { label: 'Day Streak', value: streak > 0 ? `${streak}🔥` : '—' },
        { label: 'Total Sales', value: String(totalSales) },
        { label: 'Top Channel', value: topChannel || '—' },
      ])}
      ${resultsHighlight ? highlightBox(`<strong>Results highlight:</strong> ${resultsHighlight}`, '#10B981') : ''}
      ${p(salesProgressText)}
      ${highlightBox(encouragingMessage, '#E8621A')}
      ${ctaButton("See this week's action →", `${baseUrl}/dashboard`)}
    `),
  });
}
