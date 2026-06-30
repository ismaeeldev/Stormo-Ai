import { describe, it, expect } from 'vitest';

// Test resultsToForm logic extracted from ActionHistoryList.tsx

interface ResultsData {
  id: string;
  reach: number | null;
  engagement: number | null;
  followersGained: number | null;
  salesAttributed: number | null;
  clicksToStore: number | null;
  emailListAdditions: number | null;
  notes: string | null;
  loggedAt: string | null;
  updatedAt: string | null;
}

interface FormData {
  reach: string;
  engagement: string;
  followersGained: string;
  salesAttributed: string;
  clicksToStore: string;
  emailListAdditions: string;
  notes: string;
}

const EMPTY_FORM: FormData = {
  reach: '', engagement: '', followersGained: '',
  salesAttributed: '', clicksToStore: '', emailListAdditions: '', notes: '',
};

function resultsToForm(r: ResultsData | null): FormData {
  if (!r) return { ...EMPTY_FORM };
  return {
    reach:               r.reach != null ? String(r.reach) : '',
    engagement:          r.engagement != null ? String(r.engagement) : '',
    followersGained:     r.followersGained != null ? String(r.followersGained) : '',
    salesAttributed:     r.salesAttributed != null ? String(r.salesAttributed) : '',
    clicksToStore:       r.clicksToStore != null ? String(r.clicksToStore) : '',
    emailListAdditions:  r.emailListAdditions != null ? String(r.emailListAdditions) : '',
    notes:               r.notes ?? '',
  };
}

const FULL_RESULTS: ResultsData = {
  id: 'res-1', reach: 500, engagement: 45, followersGained: 12,
  salesAttributed: 3, clicksToStore: 78, emailListAdditions: 5,
  notes: 'Good response from the r/shopify post',
  loggedAt: '2026-06-28T10:00:00Z', updatedAt: '2026-06-28T10:00:00Z',
};

describe('resultsToForm()', () => {
  it('best: converts all numeric fields to strings', () => {
    const form = resultsToForm(FULL_RESULTS);
    expect(form.reach).toBe('500');
    expect(form.engagement).toBe('45');
    expect(form.followersGained).toBe('12');
    expect(form.salesAttributed).toBe('3');
    expect(form.clicksToStore).toBe('78');
    expect(form.emailListAdditions).toBe('5');
    expect(form.notes).toBe('Good response from the r/shopify post');
  });

  it('worst: null results returns all-empty form', () => {
    const form = resultsToForm(null);
    expect(form).toEqual(EMPTY_FORM);
    expect(form.reach).toBe('');
    expect(form.notes).toBe('');
  });

  it('avg: partial results — null fields become empty strings', () => {
    const partial: ResultsData = {
      ...FULL_RESULTS,
      reach: null, followersGained: null, notes: null,
    };
    const form = resultsToForm(partial);
    expect(form.reach).toBe('');
    expect(form.followersGained).toBe('');
    expect(form.notes).toBe('');
    expect(form.engagement).toBe('45'); // non-null field preserved
  });

  it('avg: zero values are preserved (not treated as falsy)', () => {
    const withZeros: ResultsData = {
      ...FULL_RESULTS,
      reach: 0, engagement: 0, salesAttributed: 0,
    };
    const form = resultsToForm(withZeros);
    expect(form.reach).toBe('0');
    expect(form.engagement).toBe('0');
    expect(form.salesAttributed).toBe('0');
  });

  it('worst: empty notes string is preserved', () => {
    const form = resultsToForm({ ...FULL_RESULTS, notes: '' });
    expect(form.notes).toBe('');
  });

  it('avg: large numbers convert correctly', () => {
    const form = resultsToForm({ ...FULL_RESULTS, reach: 1_000_000 });
    expect(form.reach).toBe('1000000');
  });
});
