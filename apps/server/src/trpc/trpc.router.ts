import { createTRPCRouter } from '@nook/trpc';
import { SupabaseService } from '../supabase/supabase.service';
import { createAuthRouter } from '../routers/auth.router';

export function createAppRouter(supabaseService: SupabaseService) {
  return createTRPCRouter({
    auth: createAuthRouter(supabaseService),
  });
}

// 타입 추론용 — 런타임에 사용되지 않음
export type AppRouter = ReturnType<typeof createAppRouter>;
