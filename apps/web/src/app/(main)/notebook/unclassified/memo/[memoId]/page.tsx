import { createClient } from '@/lib/supabase/server';
import { MemoEditor } from '@/components/editor/MemoEditor';
import { notFound } from 'next/navigation';

export default async function UnclassifiedMemoPage({
  params,
}: {
  params: Promise<{ memoId: string }>;
}) {
  const { memoId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) notFound();

  const { data: memo } = await supabase
    .from('memos')
    .select('id, content')
    .eq('id', memoId)
    .eq('user_id', user.id)
    .single();

  if (!memo) notFound();

  return (
    <div className="flex-1 h-full flex flex-col overflow-hidden">
      <MemoEditor memoId={memo.id} initialContent={memo.content ?? ''} />
    </div>
  );
}
