'use client';

import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { MemoItem } from './MemoItem';

export function MemoList({
  notebookId,
  notebookSlug,
}: {
  notebookId: string | null;
  notebookSlug: string;
}) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const { data: memos = [] } = trpc.memo.list.useQuery({ notebookId });

  const createMemo = trpc.memo.create.useMutation({
    onSuccess: (memo) => {
      utils.memo.list.invalidate();
      router.push(`/notebook/${notebookSlug}/memo/${memo.id}`);
    },
  });

  return (
    <div className="w-72 h-full flex flex-col border-r border-gray-200 bg-white flex-shrink-0">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="text-sm font-semibold text-gray-700">
          {notebookId === null ? '미분류' : '메모'}
        </span>
        <button
          onClick={() =>
            createMemo.mutate({ notebookId: notebookId ?? undefined })
          }
          className="text-gray-400 hover:text-gray-700 text-xl leading-none"
          title="새 메모"
        >
          +
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {memos.length === 0 ? (
          <p className="text-sm text-gray-400 text-center mt-8">메모가 없습니다</p>
        ) : (
          memos.map((memo) => (
            <MemoItem key={memo.id} memo={memo} notebookSlug={notebookSlug} />
          ))
        )}
      </div>
    </div>
  );
}
