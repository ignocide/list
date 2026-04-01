import { initTRPC, TRPCError } from '@trpc/server';

export interface TRPCContext {
  user: { sub: string; email: string } | null;
}

const t = initTRPC.context<TRPCContext>().create();

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

/** 인증이 필요한 프로시저. 미인증 시 UNAUTHORIZED 에러를 던진다. */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({ ctx: { user: ctx.user } });
});

export { TRPCError };
