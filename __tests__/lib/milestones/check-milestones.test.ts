import { describe, it, expect, vi, beforeEach } from 'vitest';

// Test the EVENT_TO_MILESTONE mapping and logic in isolation

const EVENT_TO_MILESTONE: Record<string, string> = {
  action_completed:  'first_action',
  sale_reported:     'first_sale',
  content_viewed:    'first_content_viewed',
  outreach_added:    'first_outreach_added',
  login:             'first_login',
};

function getMilestoneKey(event: string): string | undefined {
  return EVENT_TO_MILESTONE[event];
}

describe('Milestone event mapping', () => {
  it('best: maps action_completed → first_action', () => {
    expect(getMilestoneKey('action_completed')).toBe('first_action');
  });

  it('best: maps sale_reported → first_sale', () => {
    expect(getMilestoneKey('sale_reported')).toBe('first_sale');
  });

  it('best: maps login → first_login', () => {
    expect(getMilestoneKey('login')).toBe('first_login');
  });

  it('best: maps outreach_added → first_outreach_added', () => {
    expect(getMilestoneKey('outreach_added')).toBe('first_outreach_added');
  });

  it('best: maps content_viewed → first_content_viewed', () => {
    expect(getMilestoneKey('content_viewed')).toBe('first_content_viewed');
  });

  it('worst: unrecognized event returns undefined', () => {
    expect(getMilestoneKey('unknown_event')).toBeUndefined();
  });

  it('worst: empty string returns undefined', () => {
    expect(getMilestoneKey('')).toBeUndefined();
  });

  it('worst: case-sensitive mismatch returns undefined', () => {
    expect(getMilestoneKey('Action_Completed')).toBeUndefined();
    expect(getMilestoneKey('LOGIN')).toBeUndefined();
  });
});

describe('ten_sales milestone trigger logic', () => {
  function shouldAwardTenSales(event: string, totalSales: number | null): boolean {
    if (event !== 'sale_reported') return false;
    return (totalSales ?? 0) >= 10;
  }

  it('best: awards ten_sales when sale_reported and totalSales=10', () => {
    expect(shouldAwardTenSales('sale_reported', 10)).toBe(true);
  });

  it('best: awards ten_sales when totalSales > 10', () => {
    expect(shouldAwardTenSales('sale_reported', 50)).toBe(true);
  });

  it('avg: does not award when totalSales=9', () => {
    expect(shouldAwardTenSales('sale_reported', 9)).toBe(false);
  });

  it('worst: does not award on wrong event even with 10+ sales', () => {
    expect(shouldAwardTenSales('action_completed', 15)).toBe(false);
  });

  it('worst: handles null totalSales gracefully', () => {
    expect(shouldAwardTenSales('sale_reported', null)).toBe(false);
  });
});
