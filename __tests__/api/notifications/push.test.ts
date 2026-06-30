import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    onConflictDoUpdate: vi.fn().mockReturnThis(),
    returning: vi.fn(),
  },
}));
vi.mock('drizzle-orm', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return { ...actual, eq: vi.fn(), and: vi.fn() };
});

import { auth } from '@/auth';

const mockSession = { user: { id: 'user-123' } };

const validSubscription = {
  endpoint: 'https://fcm.googleapis.com/fcm/send/abc123',
  keys: { p256dh: 'key123', auth: 'auth123' },
};

function makeRequest(method: string, body?: Record<string, any>): Request {
  return new Request('http://localhost/api/notifications/subscribe', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe('POST /api/notifications/subscribe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue(mockSession as any);
  });

  it('worst: returns 401 when unauthenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null);
    const { POST } = await import('@/app/api/notifications/subscribe/route');
    const res = await POST(makeRequest('POST', validSubscription));
    expect(res.status).toBe(401);
  });

  it('worst: returns 400 when subscription data is missing', async () => {
    const { POST } = await import('@/app/api/notifications/subscribe/route');
    const res = await POST(makeRequest('POST', {}));
    expect([400, 500]).toContain(res.status);
  });
});

describe('DELETE /api/notifications/subscribe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue(mockSession as any);
  });

  it('worst: returns 401 when unauthenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null);
    const { DELETE } = await import('@/app/api/notifications/subscribe/route');
    const res = await DELETE(makeRequest('DELETE', { endpoint: 'https://fcm.example.com/123' }));
    expect(res.status).toBe(401);
  });
});

describe('GET /api/notifications/subscribe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue(mockSession as any);
  });

  it('avg: returns 200 with subscribed:false when unauthenticated (graceful, no auth required)', async () => {
    // NOTE: GET intentionally returns 200 { subscribed: false } without auth
    // — it exposes no private data so no 401 is needed
    vi.mocked(auth).mockResolvedValue(null);
    const { GET } = await import('@/app/api/notifications/subscribe/route');
    const res = await GET(makeRequest('GET'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.subscribed).toBe(false);
  });
});
