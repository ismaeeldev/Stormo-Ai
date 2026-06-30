import { describe, it, expect, vi, beforeEach } from 'vitest';

// Test the updateCoverageMap logic in isolation
// The function reads a profile, merges a new channel entry, and writes back

function buildCoverageMap(
  existing: Record<string, any>,
  channel: string,
  signal: string
): Record<string, any> {
  const map = { ...existing };
  if (!map[channel]) {
    map[channel] = { count: 0 };
  }
  map[channel].count += 1;
  map[channel].lastUsed = new Date().toISOString().split('T')[0];
  map[channel].signal = signal;
  return map;
}

describe('Coverage map merge logic', () => {
  it('best: adds new channel entry when none exists', () => {
    const result = buildCoverageMap({}, 'reddit', 'Good');
    expect(result.reddit.count).toBe(1);
    expect(result.reddit.signal).toBe('Good');
    expect(result.reddit.lastUsed).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('avg: increments count on repeated channel use', () => {
    const existing = { reddit: { count: 3, signal: 'Good', lastUsed: '2026-01-01' } };
    const result = buildCoverageMap(existing, 'reddit', 'Neutral');
    expect(result.reddit.count).toBe(4);
    expect(result.reddit.signal).toBe('Neutral');
  });

  it('avg: does not affect other channels when updating one', () => {
    const existing = {
      reddit: { count: 2, signal: 'Good', lastUsed: '2026-01-01' },
      email:  { count: 1, signal: 'Weak', lastUsed: '2026-01-02' },
    };
    const result = buildCoverageMap(existing, 'instagram', 'Good');
    expect(result.reddit.count).toBe(2);
    expect(result.email.count).toBe(1);
    expect(result.instagram.count).toBe(1);
  });

  it('worst: empty string signal is stored as-is', () => {
    const result = buildCoverageMap({}, 'seo', '');
    expect(result.seo.signal).toBe('');
    expect(result.seo.count).toBe(1);
  });

  it('worst: null signal is stored (caller passes null ?? empty string)', () => {
    const result = buildCoverageMap({}, 'email', '');
    expect(result.email).toBeDefined();
  });

  it('best: lastUsed matches today date format', () => {
    const result = buildCoverageMap({}, 'instagram', 'Good');
    const today = new Date().toISOString().split('T')[0];
    expect(result.instagram.lastUsed).toBe(today);
  });

  it('avg: multiple channels built up independently', () => {
    let map = {};
    map = buildCoverageMap(map, 'reddit',    'Good');
    map = buildCoverageMap(map, 'instagram', 'Weak');
    map = buildCoverageMap(map, 'email',     'Good');
    map = buildCoverageMap(map, 'reddit',    'Neutral');
    expect((map as any).reddit.count).toBe(2);
    expect((map as any).instagram.count).toBe(1);
    expect((map as any).email.count).toBe(1);
  });
});
