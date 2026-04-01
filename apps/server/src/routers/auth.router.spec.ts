import { createTRPCRouter } from '@nook/trpc';
import { createAuthRouter } from './auth.router';

function makeMockSupabase() {
  const chain = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    upsert: jest.fn().mockResolvedValue({ error: null }),
  };
  return { client: { from: jest.fn().mockReturnValue(chain), ...chain } };
}

describe('auth.me', () => {
  it('인증된 유저의 정보를 반환한다', async () => {
    const mock = makeMockSupabase();
    (mock.client.from('users') as any).single.mockResolvedValueOnce({
      data: { id: 'user-1', email: 'a@b.com', created_at: '2026-01-01' },
      error: null,
    });

    const router = createTRPCRouter({ auth: createAuthRouter(mock as any) });
    const caller = router.createCaller({ user: { sub: 'user-1', email: 'a@b.com' } });

    const result = await caller.auth.me();
    expect(result).toEqual({ id: 'user-1', email: 'a@b.com', createdAt: '2026-01-01' });
  });

  it('user가 null이면 UNAUTHORIZED를 던진다', async () => {
    const mock = makeMockSupabase();
    const router = createTRPCRouter({ auth: createAuthRouter(mock as any) });
    const caller = router.createCaller({ user: null });

    await expect(caller.auth.me()).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });
});

describe('auth.updatePreferences', () => {
  it('lastNotebookId와 lastScrollMemoId를 upsert한다', async () => {
    const mock = makeMockSupabase();
    const router = createTRPCRouter({ auth: createAuthRouter(mock as any) });
    const caller = router.createCaller({ user: { sub: 'user-1', email: 'a@b.com' } });

    const result = await caller.auth.updatePreferences({
      lastNotebookId: 'nb-1',
      lastScrollMemoId: 'memo-1',
    });

    expect(result).toEqual({ success: true });
    expect(mock.client.from).toHaveBeenCalledWith('user_preferences');
  });
});
