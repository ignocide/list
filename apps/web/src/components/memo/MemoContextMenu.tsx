'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';

export function MemoContextMenu({
  memoId,
  notebookId,
  onClose,
}: {
  memoId: string;
  notebookId: string | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const ref = useRef<HTMLDivElement>(null);

  const deleteMemo = trpc.memo.delete.useMutation({
    onSuccess: () => {
      utils.memo.list.invalidate();
      const base = notebookId ? `/notebook/${notebookId}` : '/notebook/unclassified';
      router.push(base);
      onClose();
    },
  });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute right-2 top-2 z-50 bg-white border border-gray-200 rounded-lg shadow-md py-1 min-w-32"
    >
      <button
        onClick={() => deleteMemo.mutate({ id: memoId })}
        className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left"
      >
        삭제
      </button>
    </div>
  );
}
