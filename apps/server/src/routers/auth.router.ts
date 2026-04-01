import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, TRPCError } from '@nook/trpc';
import { SupabaseService } from '../supabase/supabase.service';

export function createAuthRouter(supabaseService: SupabaseService) {
  return createTRPCRouter({
    me: protectedProcedure.query(async ({ ctx }) => {
      const { data, error } = await supabaseService.client
        .from('users')
        .select('id, email, created_at')
        .eq('id', ctx.user.sub)
        .single();

      if (error || !data) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }

      return {
        id: data.id as string,
        email: data.email as string,
        createdAt: data.created_at as string,
      };
    }),

    updatePreferences: protectedProcedure
      .input(
        z.object({
          lastNotebookId: z.string().nullable().optional(),
          lastScrollMemoId: z.string().nullable().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const { error } = await supabaseService.client
          .from('user_preferences')
          .upsert({
            user_id: ctx.user.sub,
            last_notebook_id: input.lastNotebookId ?? null,
            last_scroll_memo_id: input.lastScrollMemoId ?? null,
            updated_at: new Date().toISOString(),
          });

        if (error) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        }

        return { success: true };
      }),
  });
}
