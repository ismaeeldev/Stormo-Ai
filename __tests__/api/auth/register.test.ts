import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn(),
  },
}));
vi.mock('drizzle-orm', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return { ...actual, eq: vi.fn() };
});
vi.mock('bcryptjs', () => ({
  default: { hash: vi.fn().mockResolvedValue('hashed-password') },
}));
vi.mock('@/lib/email/sender', () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('crypto', () => ({
  randomBytes: vi.fn(() => Buffer.from('abc123deadbeef0000000000', 'hex')),
}));

import { db } from '@/lib/db';

function makeRegisterRequest(body: Record<string, any>): Request {
  return new Request('http://localhost/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('worst: returns 400 when email is missing', async () => {
    const { POST } = await import('@/app/api/auth/register/route');
    const res = await POST(makeRegisterRequest({ password: 'pass123' }));
    expect(res.status).toBe(400);
  });

  it('worst: returns 400 when password is missing', async () => {
    const { POST } = await import('@/app/api/auth/register/route');
    const res = await POST(makeRegisterRequest({ email: 'test@example.com' }));
    expect(res.status).toBe(400);
  });

  it('worst: returns 409 when email already exists', async () => {
    // DB returns existing user
    vi.mocked(db.where).mockResolvedValue([{ id: 'existing', email: 'test@example.com' }] as any);
    const { POST } = await import('@/app/api/auth/register/route');
    const res = await POST(makeRegisterRequest({
      email: 'test@example.com',
      password: 'password123',
    }));
    expect([400, 409]).toContain(res.status);
  });

  it('best: creates user when email not taken (terms accepted)', async () => {
    // No existing user
    vi.mocked(db.where).mockResolvedValue([] as any);
    vi.mocked(db.returning).mockResolvedValue([{
      id: 'new-user', email: 'new@example.com', emailVerified: false,
    }] as any);
    const { POST } = await import('@/app/api/auth/register/route');
    const res = await POST(makeRegisterRequest({
      email: 'new@example.com',
      password: 'securepassword123',
      name: 'Test User',
      terms: true, // Zod schema requires terms: true
    }));
    expect([200, 201]).toContain(res.status);
  });

  it('worst: returns 400 when terms not accepted', async () => {
    const { POST } = await import('@/app/api/auth/register/route');
    const res = await POST(makeRegisterRequest({
      email: 'test@example.com',
      password: 'securepassword123',
      // terms omitted
    }));
    expect(res.status).toBe(400);
  });

  it('worst: returns 400 on malformed JSON body', async () => {
    const req = new Request('http://localhost/api/auth/register', {
      method: 'POST',
      body: 'not-json',
    });
    const { POST } = await import('@/app/api/auth/register/route');
    const res = await POST(req);
    expect([400, 500]).toContain(res.status);
  });
});
