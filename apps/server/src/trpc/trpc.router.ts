import { createTRPCRouter } from '@nook/trpc';
import { SupabaseService } from '../supabase/supabase.service';
import { createAuthRouter } from '../routers/auth.router';
import { createNotebookRouter } from '../routers/notebook.router';
import { createMemoRouter } from '../routers/memo.router';

export function createAppRouter(supabaseService: SupabaseService) {
  return createTRPCRouter({
    auth: createAuthRouter(supabaseService),
    notebook: createNotebookRouter(supabaseService),
    memo: createMemoRouter(supabaseService),
  });
}

export type AppRouter = ReturnType<typeof createAppRouter>;
