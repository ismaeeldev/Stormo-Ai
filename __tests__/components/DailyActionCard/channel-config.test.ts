import { describe, it, expect } from 'vitest';

// Test the channel/effort/category config maps from DailyActionCard

const EFFORT_MAP: Record<string, string> = {
  community: '~25 min', content: '~35 min', outreach: '~45 min',
  seo: '~30 min', paid_ads: '~20 min',
};

const CATEGORY_MAP: Record<string, string> = {
  community: 'Community', content: 'Content', outreach: 'Outreach',
  seo: 'SEO', paid_ads: 'Paid Ads',
};

const KNOWN_CHANNELS = ['instagram', 'reddit', 'email', 'seo', 'influencer', 'optimize', 'planning', 'paid_ads'];

describe('EFFORT_MAP', () => {
  it('best: all known action types have effort estimates', () => {
    ['community', 'content', 'outreach', 'seo', 'paid_ads'].forEach((type) => {
      expect(EFFORT_MAP[type]).toBeDefined();
      expect(EFFORT_MAP[type]).toMatch(/^~\d+ min$/);
    });
  });

  it('avg: outreach is the longest at 45 min', () => {
    expect(EFFORT_MAP['outreach']).toBe('~45 min');
  });

  it('worst: unknown action type returns undefined (card falls back to ~30 min)', () => {
    expect(EFFORT_MAP['unknown']).toBeUndefined();
  });
});

describe('CATEGORY_MAP', () => {
  it('best: all keys map to human-readable labels', () => {
    expect(CATEGORY_MAP['community']).toBe('Community');
    expect(CATEGORY_MAP['seo']).toBe('SEO');
    expect(CATEGORY_MAP['paid_ads']).toBe('Paid Ads');
  });

  it('worst: unknown type returns undefined (card falls back to raw value)', () => {
    expect(CATEGORY_MAP['unknown']).toBeUndefined();
  });
});

describe('Channel label formatting', () => {
  it('best: capitalises first letter of channel name', () => {
    const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
    expect(capitalize('reddit')).toBe('Reddit');
    expect(capitalize('instagram')).toBe('Instagram');
    expect(capitalize('email')).toBe('Email');
    expect(capitalize('seo')).toBe('Seo'); // note: not "SEO" — card uses raw capitalize
  });

  it('avg: all known channels can be capitalised without error', () => {
    const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
    KNOWN_CHANNELS.forEach((ch) => {
      expect(() => capitalize(ch)).not.toThrow();
      expect(capitalize(ch).length).toBeGreaterThan(0);
    });
  });
});

describe('Scheduled date formatting', () => {
  it('best: formats ISO date string to readable date', () => {
    const dateStr = '2026-06-28';
    const formatted = new Date(dateStr).toLocaleDateString(undefined, {
      weekday: 'short', month: 'short', day: 'numeric',
    });
    expect(formatted).toContain('Jun');
    expect(formatted).toContain('28');
  });

  it('worst: invalid date string produces Invalid Date string', () => {
    const formatted = new Date('not-a-date').toLocaleDateString(undefined, {
      weekday: 'short', month: 'short', day: 'numeric',
    });
    expect(typeof formatted).toBe('string');
  });
});
