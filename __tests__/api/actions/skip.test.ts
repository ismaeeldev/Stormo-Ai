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

describe('PATCH /api/actions/[id]/skip', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue(mockSession as any);
  });

  it('worst: returns 401 when unauthenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null);
    const { PATCH } = await import('@/app/api/actions/[id]/skip/route');
    const res = await PATCH(new Request('http://localhost'), mockParams as any);
    expect(res.status).toBe(401);
  });

  it('best: sets status to skipped', async () => {
    vi.mocked(db.returning).mockResolvedValue([{ id: 'action-abc', status: 'skipped' }] as any);
    const { PATCH } = await import('@/app/api/actions/[id]/skip/route');
    const res = await PATCH(new Request('http://localhost'), mockParams as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('skipped');
  });

  it('worst: returns 404 when action not found for this user', async () => {
    vi.mocked(db.returning).mockResolvedValue([] as any);
    const { PATCH } = await import('@/app/api/actions/[id]/skip/route');
    const res = await PATCH(new Request('http://localhost'), mockParams as any);
    expect(res.status).toBe(404);
  });
});
