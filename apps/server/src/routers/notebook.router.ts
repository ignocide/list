// apps/server/src/routers/notebook.router.ts
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, TRPCError } from '@nook/trpc';
import { SupabaseService } from '../supabase/supabase.service';
import { Notebook } from '@nook/types';

function toNotebook(row: Record<string, unknown>): Notebook {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    name: row.name as string,
    color: row.color as string,
    order: row.order as number,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function createNotebookRouter(supabaseService: SupabaseService) {
  return createTRPCRouter({
    list: protectedProcedure.query(async ({ ctx }) => {
      const { data, error } = await supabaseService.client
        .from('notebooks')
        .select('*')
        .eq('user_id', ctx.user.sub)
        .order('order', { ascending: true })
        .order('created_at', { ascending: true });
      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return (data ?? []).map(toNotebook);
    }),

    create: protectedProcedure
      .input(z.object({ name: z.string().min(1).max(100), color: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        const { data, error } = await supabaseService.client
          .from('notebooks')
          .insert({
            user_id: ctx.user.sub,
            name: input.name,
            color: input.color ?? '#868e96',
          })
          .select()
          .single();
        if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
        return toNotebook(data as Record<string, unknown>);
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.string().uuid(),
          name: z.string().min(1).max(100).optional(),
          color: z.string().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (input.name !== undefined) patch.name = input.name;
        if (input.color !== undefined) patch.color = input.color;
        const { data, error } = await supabaseService.client
          .from('notebooks')
          .update(patch)
          .eq('id', input.id)
          .eq('user_id', ctx.user.sub)
          .select()
          .single();
        if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
        return toNotebook(data as Record<string, unknown>);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        const { error } = await supabaseService.client
          .from('notebooks')
          .delete()
          .eq('id', input.id)
          .eq('user_id', ctx.user.sub);
        if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
        return { id: input.id };
      }),
  });
}
