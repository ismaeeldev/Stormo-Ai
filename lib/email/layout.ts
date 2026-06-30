/**
 * Shared branded email layout.
 * Every outbound email must go through brandedEmail() so the design is
 * identical to welcome.html and the other existing HTML templates:
 *   - Dark header with Stormo logo
 *   - Orange top-border accent (#E8621A)
 *   - White card body
 *   - Light grey footer with copyright
 */

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXTAUTH_URL ||
  'http://localhost:3000';

/** Wraps inner HTML content in the full branded email shell. */
export function brandedEmail(innerHtml: string): string {
  const logoUrl = `${BASE_URL}/stormo-logo.png`;
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F5F5F5; color: #1A1A1A; margin: 0; padding: 20px;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #FFFFFF; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); overflow: hidden; border-top: 3px solid #E8621A;">
    <!-- Logo header -->
    <tr>
      <td align="center" style="background-color: #1A1A1A; padding: 28px 20px;">
        <img src="${logoUrl}" alt="Stormo" style="height: 44px; width: auto; display: block; border: 0;" />
      </td>
    </tr>
    <!-- Body -->
    <tr>
      <td style="padding: 40px 32px;">
        ${innerHtml}
        <hr style="border: 0; border-top: 1px solid #E5E7EB; margin: 32px 0 24px;">
        <p style="font-size: 13px; color: #9CA3AF; margin: 0; text-align: center;">
          You received this email because you have a Stormo account.
        </p>
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td align="center" style="background-color: #F9FAFB; padding: 18px 20px; border-top: 1px solid #F3F4F6;">
        <p style="font-size: 12px; color: #9CA3AF; margin: 0;">
          &copy; 2026 Stormo.io. All rights reserved.
          &nbsp;&middot;&nbsp;
          <a href="${BASE_URL}/dashboard/settings" style="color: #9CA3AF; text-decoration: underline;">Manage preferences</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Orange CTA button — matches the style in welcome.html. */
export function ctaButton(label: string, url: string): string {
  return `<table border="0" cellpadding="0" cellspacing="0" style="margin: 28px auto;">
  <tr>
    <td align="center" bgcolor="#E8621A" style="border-radius: 8px;">
      <a href="${url}" target="_blank" style="display: inline-block; padding: 14px 30px; font-family: 'Inter', sans-serif; font-size: 15px; font-weight: 600; color: #FFFFFF; text-decoration: none; border-radius: 8px;">${label}</a>
    </td>
  </tr>
</table>`;
}

/** Standard heading — h1 style used in welcome.html. */
export function h1(text: string): string {
  return `<h1 style="font-size: 22px; font-weight: 700; color: #1A1A1A; margin: 0 0 20px 0;">${text}</h1>`;
}

/** Standard body paragraph — matches existing template p style. */
export function p(text: string): string {
  return `<p style="font-size: 15px; line-height: 26px; color: #555555; margin: 0 0 16px 0;">${text}</p>`;
}

/** Bullet list of strings. */
export function ul(items: string[]): string {
  const lis = items
    .map(
      (item) =>
        `<li style="font-size: 15px; line-height: 26px; color: #555555; margin-bottom: 6px;">${item}</li>`
    )
    .join('');
  return `<ul style="margin: 0 0 20px 0; padding-left: 22px;">${lis}</ul>`;
}

/** Highlight box — used for notable stats (weekly summary, milestones). */
export function highlightBox(text: string, color: '#E8621A' | '#10B981' | '#F59E0B' = '#E8621A'): string {
  const bgMap: Record<string, string> = {
    '#E8621A': '#FFF5F0',
    '#10B981': '#F0FDF4',
    '#F59E0B': '#FFFBEB',
  };
  return `<div style="background: ${bgMap[color] ?? '#FFF5F0'}; border-left: 3px solid ${color}; border-radius: 6px; padding: 14px 18px; margin: 0 0 20px 0;">
  <p style="font-size: 14px; line-height: 22px; color: #1A1A1A; margin: 0;">${text}</p>
</div>`;
}

/** 2-column stat row — used in weekly summary. */
export function statGrid(stats: Array<{ label: string; value: string }>): string {
  const cells = stats
    .map(
      (s) =>
        `<td style="width: 25%; text-align: center; padding: 12px 8px; vertical-align: top;">
          <p style="font-size: 22px; font-weight: 700; color: #E8621A; margin: 0 0 4px 0;">${s.value}</p>
          <p style="font-size: 11px; font-weight: 600; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.05em; margin: 0;">${s.label}</p>
        </td>`
    )
    .join('');
  return `<table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 0 0 24px 0; background: #F9FAFB; border-radius: 8px; overflow: hidden;">
  <tr>${cells}</tr>
</table>`;
}
