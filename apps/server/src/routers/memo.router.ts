// apps/server/src/routers/memo.router.ts
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, TRPCError } from '@nook/trpc';
import { SupabaseService } from '../supabase/supabase.service';
import { Memo } from '@nook/types';

function toMemo(row: Record<string, unknown>): Memo {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    notebookId: (row.notebook_id as string | null) ?? null,
    content: (row.content as string) ?? '',
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function createMemoRouter(supabaseService: SupabaseService) {
  return createTRPCRouter({
    list: protectedProcedure
      .input(z.object({ notebookId: z.string().uuid().nullable() }))
      .query(async ({ ctx, input }) => {
        let query = supabaseService.client
          .from('memos')
          .select('*')
          .eq('user_id', ctx.user.sub)
          .order('updated_at', { ascending: false });

        if (input.notebookId === null) {
          query = query.is('notebook_id', null);
        } else {
          query = query.eq('notebook_id', input.notebookId);
        }

        const { data, error } = await query;
        if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
        return (data ?? []).map(toMemo);
      }),

    get: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        const { data, error } = await supabaseService.client
          .from('memos')
          .select('*')
          .eq('id', input.id)
          .eq('user_id', ctx.user.sub)
          .single();
        if (error) throw new TRPCError({ code: 'NOT_FOUND', message: 'Memo not found' });
        return toMemo(data as Record<string, unknown>);
      }),

    create: protectedProcedure
      .input(z.object({ notebookId: z.string().uuid().optional() }))
      .mutation(async ({ ctx, input }) => {
        const { data, error } = await supabaseService.client
          .from('memos')
          .insert({
            user_id: ctx.user.sub,
            notebook_id: input.notebookId ?? null,
            content: '',
          })
          .select()
          .single();
        if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
        return toMemo(data as Record<string, unknown>);
      }),

    update: protectedProcedure
      .input(z.object({ id: z.string().uuid(), content: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const { data, error } = await supabaseService.client
          .from('memos')
          .update({ content: input.content, updated_at: new Date().toISOString() })
          .eq('id', input.id)
          .eq('user_id', ctx.user.sub)
          .select()
          .single();
        if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
        return toMemo(data as Record<string, unknown>);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        const { error } = await supabaseService.client
          .from('memos')
          .delete()
          .eq('id', input.id)
          .eq('user_id', ctx.user.sub);
        if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
        return { id: input.id };
      }),
  });
}
