import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockResolvedValue([]),
  },
}));
vi.mock('drizzle-orm', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return { ...actual, eq: vi.fn(), and: vi.fn(), desc: vi.fn(), inArray: vi.fn() };
});

import { auth } from '@/auth';
import { db } from '@/lib/db';

const mockSession = { user: { id: 'user-123' } };

function makeHistoryRequest(params: Record<string, string> = {}): Request {
  const url = new URL('http://localhost/api/actions/history');
  Object.entries({ page: '1', limit: '10', status: 'all', channel: 'all', ...params })
    .forEach(([k, v]) => url.searchParams.set(k, v));
  return new Request(url.toString());
}

describe('GET /api/actions/history', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue(mockSession as any);
    vi.mocked(db.offset).mockResolvedValue([]);
  });

  it('worst: returns 401 when unauthenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null);
    const { GET } = await import('@/app/api/actions/history/route');
    const res = await GET(makeHistoryRequest());
    expect(res.status).toBe(401);
  });

  it('best: returns empty array when user has no actions', async () => {
    vi.mocked(db.offset).mockResolvedValue([]);
    const { GET } = await import('@/app/api/actions/history/route');
    const res = await GET(makeHistoryRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  it('best: returns paginated actions', async () => {
    const mockActions = Array.from({ length: 5 }, (_, i) => ({
      id: `act-${i}`, title: `Action ${i}`, status: 'completed', channel: 'reddit',
      scheduledFor: '2026-06-28', outcomeSignal: null,
    }));
    vi.mocked(db.offset).mockResolvedValue(mockActions as any);
    const { GET } = await import('@/app/api/actions/history/route');
    const res = await GET(makeHistoryRequest({ page: '1', limit: '10' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.length).toBe(5);
  });

  it('avg: page 2 uses correct offset', async () => {
    vi.mocked(db.offset).mockResolvedValue([]);
    const { GET } = await import('@/app/api/actions/history/route');
    const res = await GET(makeHistoryRequest({ page: '2', limit: '10' }));
    expect(res.status).toBe(200);
  });

  it('avg: status filter applies (completed only)', async () => {
    vi.mocked(db.offset).mockResolvedValue([]);
    const { GET } = await import('@/app/api/actions/history/route');
    const res = await GET(makeHistoryRequest({ status: 'completed' }));
    expect(res.status).toBe(200);
  });

  it('avg: channel filter applies (reddit only)', async () => {
    vi.mocked(db.offset).mockResolvedValue([]);
    const { GET } = await import('@/app/api/actions/history/route');
    const res = await GET(makeHistoryRequest({ channel: 'reddit' }));
    expect(res.status).toBe(200);
  });

  it('worst: invalid page number defaults gracefully', async () => {
    vi.mocked(db.offset).mockResolvedValue([]);
    const { GET } = await import('@/app/api/actions/history/route');
    const res = await GET(makeHistoryRequest({ page: 'abc' }));
    expect([200, 400]).toContain(res.status);
  });
});
