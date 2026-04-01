import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';

export function createContext({ req }: CreateExpressContextOptions) {
  return {
    user: (req as any).user as { sub: string; email: string } | null,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
