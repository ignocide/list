'use client';

import { useEffect, useRef } from 'react';
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
  const { data: memos = [], isLoading } = trpc.memo.list.useQuery({ notebookId });
  const autoCreated = useRef(false);

  const createMemo = trpc.memo.create.useMutation({
    onSuccess: (memo) => {
      utils.memo.list.invalidate();
      router.push(`/notebook/${notebookSlug}/memo/${memo.id}`);
    },
  });

  // Auto-create memo when notebook has no memos
  useEffect(() => {
    autoCreated.current = false;
  }, [notebookId]);

  useEffect(() => {
    if (!isLoading && memos.length === 0 && !autoCreated.current && !createMemo.isPending) {
      autoCreated.current = true;
      createMemo.mutate({ notebookId: notebookId ?? undefined });
    }
  }, [isLoading, memos.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreate = () => {
    if (!createMemo.isPending) {
      createMemo.mutate({ notebookId: notebookId ?? undefined });
    }
  };

  return (
    <div className="w-72 h-full flex flex-col border-r border-gray-200 bg-white flex-shrink-0">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="text-sm font-semibold text-gray-700">
          {notebookId === null ? '미분류' : '메모'}
        </span>
        <button
          onClick={handleCreate}
          disabled={createMemo.isPending}
          className="text-gray-400 hover:text-gray-700 text-xl leading-none disabled:opacity-40"
          title="새 메모"
        >
          +
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {memos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <p className="text-sm text-gray-400">메모가 없습니다</p>
            <button
              onClick={handleCreate}
              disabled={createMemo.isPending}
              className="text-xs text-blue-500 hover:text-blue-700 disabled:opacity-40"
            >
              새 메모 만들기
            </button>
          </div>
        ) : (
          memos.map((memo) => (
            <MemoItem key={memo.id} memo={memo} notebookSlug={notebookSlug} />
          ))
        )}
      </div>
    </div>
  );
}
