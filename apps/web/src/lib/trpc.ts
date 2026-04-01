import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@nook/server';
import { createClient } from './supabase/client';

export const trpc = createTRPCReact<AppRouter>();

export function createTRPCClientConfig() {
  return {
    links: [
      httpBatchLink({
        url: `${process.env.NEXT_PUBLIC_SERVER_URL}/trpc`,
        async headers() {
          const supabase = createClient();
          const { data } = await supabase.auth.getSession();
          const token = data.session?.access_token;
          return token ? { authorization: `Bearer ${token}` } : {};
        },
      }),
    ],
  };
}
