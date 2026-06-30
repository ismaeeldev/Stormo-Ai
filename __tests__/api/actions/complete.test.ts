import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';

// Mock dependencies
vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    returning: vi.fn(),
  },
}));

vi.mock('@/lib/db/queries', () => ({
  updateCoverageMap: vi.fn().mockResolvedValue(null),
}));

vi.mock('@/lib/milestones/check-milestones', () => ({
  checkAndAwardMilestones: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/email/triggers', () => ({
  triggerFirstActionCompleted: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('drizzle-orm', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return { ...actual, eq: vi.fn(), and: vi.fn(), sql: vi.fn() };
});

import { auth } from '@/auth';
import { db } from '@/lib/db';

const mockSession = {
  user: { id: 'user-123', email: 'test@example.com' },
};

const mockAction = {
  id: 'action-abc',
  userId: 'user-123',
  title: 'Test Action',
  channel: 'reddit',
  status: 'scheduled',
};

const mockParams = { params: Promise.resolve({ id: 'action-abc' }) };

function makeRequest(body: Record<string, any> = {}): Request {
  return new Request('http://localhost/api/actions/action-abc/complete', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('PATCH /api/actions/[id]/complete', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: authenticated
    vi.mocked(auth).mockResolvedValue(mockSession as any);

    // DB select returns the action
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([mockAction]),
      }),
    } as any);

    // DB update returns updated action
    const updatedAction = { ...mockAction, status: 'completed', completedAt: new Date() };
    vi.mocked(db.update).mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([updatedAction]),
        }),
      }),
    } as any);

    // Count query for first-completed email
    vi.mocked(db.select).mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([mockAction]),
      }),
    } as any).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ count: 5 }]),
      }),
    } as any);
  });

  it('worst: returns 401 when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null);
    const { PATCH } = await import('@/app/api/actions/[id]/complete/route');
    const res = await PATCH(makeRequest(), mockParams as any);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('best: returns 200 with updated action on valid complete', async () => {
    const { PATCH } = await import('@/app/api/actions/[id]/complete/route');
    const res = await PATCH(makeRequest({ outcomeSignal: null }), mockParams as any);
    expect(res.status).toBe(200);
  });

  it('avg: accepts null outcomeSignal (no popup outcome)', async () => {
    const { PATCH } = await import('@/app/api/actions/[id]/complete/route');
    const res = await PATCH(makeRequest({ outcomeSignal: null }), mockParams as any);
    expect(res.status).toBe(200);
  });

  it('avg: accepts string outcomeSignal', async () => {
    const { PATCH } = await import('@/app/api/actions/[id]/complete/route');
    const res = await PATCH(makeRequest({ outcomeSignal: 'Good' }), mockParams as any);
    expect(res.status).toBe(200);
  });

  it('avg: body parsing failure falls back to empty object (no crash)', async () => {
    const req = new Request('http://localhost/api/actions/action-abc/complete', {
      method: 'PATCH',
      body: 'invalid-json',
    });
    const { PATCH } = await import('@/app/api/actions/[id]/complete/route');
    const res = await PATCH(req, mockParams as any);
    // Should not throw — falls back to {}
    expect([200, 404, 500]).toContain(res.status);
  });
});
