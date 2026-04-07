import { MemoEditor } from '@/components/editor/MemoEditor';
import { notFound } from 'next/navigation';
import { fetchMemoForUser } from '@/lib/memo';

export default async function UnclassifiedMemoPage({
  params,
}: {
  params: Promise<{ memoId: string }>;
}) {
  const { memoId } = await params;
  const memo = await fetchMemoForUser(memoId);
  if (!memo) notFound();

  return (
    <div className="flex-1 h-full flex flex-col overflow-hidden">
      <MemoEditor memoId={memo.id} initialContent={memo.content ?? ''} notebookId={null} />
    </div>
  );
}
