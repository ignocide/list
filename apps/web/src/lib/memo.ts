import { createClient } from '@/lib/supabase/server';

export async function fetchMemoForUser(memoId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: memo } = await supabase
    .from('memos')
    .select('id, content')
    .eq('id', memoId)
    .eq('user_id', user.id)
    .single();
  return memo ?? null;
}
