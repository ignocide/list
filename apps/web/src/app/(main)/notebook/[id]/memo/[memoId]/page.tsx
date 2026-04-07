import { MemoEditor } from '@/components/editor/MemoEditor';
import { notFound } from 'next/navigation';
import { fetchMemoForUser } from '@/lib/memo';

export default async function MemoPage({
  params,
}: {
  params: Promise<{ id: string; memoId: string }>;
}) {
  const { id, memoId } = await params;
  const memo = await fetchMemoForUser(memoId);
  if (!memo) notFound();

  return (
    <div className="flex-1 h-full flex flex-col overflow-hidden">
      <MemoEditor memoId={memo.id} initialContent={memo.content ?? ''} notebookId={id} />
    </div>
  );
}
