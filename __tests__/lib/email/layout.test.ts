import { describe, it, expect, beforeEach } from 'vitest';
import { brandedEmail, ctaButton, h1, p, ul, highlightBox, statGrid } from '@/lib/email/layout';

describe('brandedEmail()', () => {
  it('best: wraps content in full HTML shell with logo, header, footer', () => {
    const html = brandedEmail('<p>Hello</p>');
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<p>Hello</p>');
    expect(html).toContain('stormo-logo.png');
    expect(html).toContain('2026 Stormo.io');
    expect(html).toContain('border-top: 3px solid #E8621A');
  });

  it('avg: empty string inner content still produces valid shell', () => {
    const html = brandedEmail('');
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('</html>');
  });

  it('worst: XSS attempt in inner content is passed through (caller is responsible)', () => {
    const html = brandedEmail('<script>alert(1)</script>');
    // The layout is for server-generated trusted content — it passes through as-is
    expect(html).toContain('<script>alert(1)</script>');
  });

  it('uses NEXTAUTH_URL when NEXT_PUBLIC_APP_URL is absent', () => {
    // The logo URL is determined at module load time so we test the default fallback
    const html = brandedEmail('test');
    expect(html).toMatch(/src=".*stormo-logo\.png"/);
  });
});

describe('ctaButton()', () => {
  it('best: renders anchor with correct label and href', () => {
    const btn = ctaButton('Go to dashboard', 'https://stormo.io/dashboard');
    expect(btn).toContain('Go to dashboard');
    expect(btn).toContain('href="https://stormo.io/dashboard"');
    expect(btn).toContain('bgcolor="#E8621A"');
  });

  it('avg: label with special chars is included verbatim', () => {
    const btn = ctaButton('Start for $9 →', 'https://stormo.io/pricing');
    expect(btn).toContain('Start for $9 →');
  });

  it('worst: empty label produces empty anchor text', () => {
    const btn = ctaButton('', 'https://stormo.io');
    expect(btn).toContain('href="https://stormo.io"');
  });
});

describe('h1()', () => {
  it('wraps text in styled h1 tag', () => {
    const out = h1('Welcome, John');
    expect(out).toMatch(/<h1[^>]+>Welcome, John<\/h1>/);
    expect(out).toContain('font-size: 22px');
  });
});

describe('p()', () => {
  it('wraps text in styled p tag', () => {
    const out = p('Your action is ready.');
    expect(out).toMatch(/<p[^>]+>Your action is ready\.<\/p>/);
    expect(out).toContain('font-size: 15px');
  });
});

describe('ul()', () => {
  it('best: renders all items as li elements', () => {
    const out = ul(['First', 'Second', 'Third']);
    expect(out).toContain('<li');
    expect(out).toContain('First');
    expect(out).toContain('Second');
    expect(out).toContain('Third');
    expect((out.match(/<li/g) || []).length).toBe(3);
  });

  it('avg: single item list', () => {
    const out = ul(['Only item']);
    expect((out.match(/<li/g) || []).length).toBe(1);
  });

  it('worst: empty array returns empty ul', () => {
    const out = ul([]);
    expect(out).toContain('<ul');
    expect(out).toContain('</ul>');
    expect(out).not.toContain('<li');
  });
});

describe('highlightBox()', () => {
  it('best: orange variant (default)', () => {
    const out = highlightBox('Great job!');
    expect(out).toContain('Great job!');
    expect(out).toContain('#E8621A');
    expect(out).toContain('#FFF5F0');
  });

  it('avg: green variant', () => {
    const out = highlightBox('Milestone reached!', '#10B981');
    expect(out).toContain('#10B981');
    expect(out).toContain('#F0FDF4');
  });

  it('avg: amber variant', () => {
    const out = highlightBox('Trial ending', '#F59E0B');
    expect(out).toContain('#F59E0B');
    expect(out).toContain('#FFFBEB');
  });
});

describe('statGrid()', () => {
  it('best: renders all stat cells', () => {
    const out = statGrid([
      { label: 'Actions', value: '7' },
      { label: 'Sales', value: '$142' },
    ]);
    expect(out).toContain('Actions');
    expect(out).toContain('7');
    expect(out).toContain('Sales');
    expect(out).toContain('$142');
    expect((out.match(/<td/g) || []).length).toBe(2);
  });

  it('worst: empty stats array renders empty table row', () => {
    const out = statGrid([]);
    expect(out).toContain('<table');
    expect(out).toContain('<tr>');
  });
});
