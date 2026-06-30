import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/db', () => ({
  db: {
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    returning: vi.fn(),
  },
}));
vi.mock('drizzle-orm', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return { ...actual, eq: vi.fn(), and: vi.fn() };
});

import { auth } from '@/auth';
import { db } from '@/lib/db';

const mockSession = { user: { id: 'user-123' } };
const mockParams = { params: Promise.resolve({ id: 'action-abc' }) };

describe('PATCH /api/actions/[id]/postpone', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue(mockSession as any);
  });

  it('worst: returns 401 when unauthenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null);
    const { PATCH } = await import('@/app/api/actions/[id]/postpone/route');
    const res = await PATCH(new Request('http://localhost'), mockParams as any);
    expect(res.status).toBe(401);
  });

  it('best: moves action to tomorrow with status postponed', async () => {
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const updatedAction = {
      id: 'action-abc', status: 'postponed', scheduledFor: tomorrow,
    };
    vi.mocked(db.returning).mockResolvedValue([updatedAction] as any);

    const { PATCH } = await import('@/app/api/actions/[id]/postpone/route');
    const res = await PATCH(new Request('http://localhost'), mockParams as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('postponed');
    expect(body.scheduledFor).toBe(tomorrow);
  });

  it('worst: returns 404 when action not found', async () => {
    vi.mocked(db.returning).mockResolvedValue([] as any);
    const { PATCH } = await import('@/app/api/actions/[id]/postpone/route');
    const res = await PATCH(new Request('http://localhost'), mockParams as any);
    expect(res.status).toBe(404);
  });

  it('avg: scheduled-for is exactly tomorrow date', async () => {
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    vi.mocked(db.returning).mockResolvedValue([{
      id: 'action-abc', scheduledFor: tomorrow, status: 'postponed',
    }] as any);

    const { PATCH } = await import('@/app/api/actions/[id]/postpone/route');
    const res = await PATCH(new Request('http://localhost'), mockParams as any);
    const body = await res.json();
    expect(body.scheduledFor).toBe(tomorrow);
  });
});
