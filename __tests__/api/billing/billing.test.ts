import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/stripe/client', () => ({
  stripe: {
    checkout: {
      sessions: { create: vi.fn() },
    },
    billingPortal: {
      sessions: { create: vi.fn() },
    },
    subscriptions: {
      retrieve: vi.fn(),
      update: vi.fn(),
    },
  },
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
vi.mock('drizzle-orm', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return { ...actual, eq: vi.fn() };
});

import { auth } from '@/auth';

const mockSession = {
  user: {
    id: 'user-123',
    email: 'test@example.com',
    subscriptionTier: 'starter',
    subscriptionStatus: 'active',
  },
};

describe('POST /api/billing/upgrade', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue(mockSession as any);
  });

  it('worst: returns 401 when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null);
    const { POST } = await import('@/app/api/billing/upgrade/route');
    const res = await POST(new Request('http://localhost/api/billing/upgrade', { method: 'POST' }));
    expect(res.status).toBe(401);
  });
});

describe('POST /api/billing/cancel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue(mockSession as any);
  });

  it('worst: returns 401 when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null);
    const { POST } = await import('@/app/api/billing/cancel/route');
    const res = await POST(new Request('http://localhost/api/billing/cancel', { method: 'POST' }));
    expect(res.status).toBe(401);
  });
});

describe('POST /api/billing/downgrade', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue(mockSession as any);
  });

  it('worst: returns 401 when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null);
    const { POST } = await import('@/app/api/billing/downgrade/route');
    const res = await POST(new Request('http://localhost/api/billing/downgrade', { method: 'POST' }));
    expect(res.status).toBe(401);
  });
});
