import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/db/queries', () => ({ getTodaysAction: vi.fn() }));
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
  },
}));
vi.mock('drizzle-orm', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return { ...actual, eq: vi.fn(), and: vi.fn(), asc: vi.fn(), inArray: vi.fn() };
});

import { auth } from '@/auth';
import { getTodaysAction } from '@/lib/db/queries';
import { db } from '@/lib/db';

const mockSession = { user: { id: 'user-123' } };

const mockScheduledAction = {
  id: 'act-1', title: 'Do Reddit post', status: 'scheduled',
  scheduledFor: new Date().toISOString().split('T')[0],
};
const mockCompletedAction = {
  id: 'act-1', title: 'Do Reddit post', status: 'completed',
  scheduledFor: new Date().toISOString().split('T')[0],
};

describe('GET /api/actions/today', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue(mockSession as any);
  });

  it('worst: returns 401 when unauthenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null);
    const { GET } = await import('@/app/api/actions/today/route');
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('best: returns scheduled action for today', async () => {
    // No completed action today
    vi.mocked(db.limit).mockResolvedValueOnce([]);
    // getTodaysAction returns active action
    vi.mocked(getTodaysAction).mockResolvedValue(mockScheduledAction as any);

    const { GET } = await import('@/app/api/actions/today/route');
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('scheduled');
  });

  it('best: returns completed action when today is already done', async () => {
    // DB finds completed action for today
    vi.mocked(db.limit).mockResolvedValueOnce([mockCompletedAction]);
    vi.mocked(getTodaysAction).mockResolvedValue(null);

    const { GET } = await import('@/app/api/actions/today/route');
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('completed');
  });

  it('avg: returns null when no action exists (triggers generate on client)', async () => {
    vi.mocked(db.limit).mockResolvedValue([]);
    vi.mocked(getTodaysAction).mockResolvedValue(null);

    const { GET } = await import('@/app/api/actions/today/route');
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toBeNull();
  });
});
