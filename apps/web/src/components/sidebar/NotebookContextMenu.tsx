'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import type { Notebook } from '@nook/types';

export function NotebookContextMenu({
  notebook,
  onClose,
}: {
  notebook: Notebook;
  onClose: () => void;
}) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const ref = useRef<HTMLDivElement>(null);
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(notebook.name);

  const updateNotebook = trpc.notebook.update.useMutation({
    onSuccess: () => { utils.notebook.list.invalidate(); setRenaming(false); onClose(); },
  });

  const deleteNotebook = trpc.notebook.delete.useMutation({
    onSuccess: () => {
      utils.notebook.list.invalidate();
      router.push('/notebook/unclassified');
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

  if (renaming) {
    return (
      <div ref={ref} className="absolute left-0 top-0 z-50 bg-white border border-gray-200 rounded-lg shadow-md p-2 w-48">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') updateNotebook.mutate({ id: notebook.id, name });
            if (e.key === 'Escape') { setRenaming(false); onClose(); }
          }}
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
      </div>
    );
  }

  return (
    <div ref={ref} className="absolute left-0 top-full z-50 bg-white border border-gray-200 rounded-lg shadow-md py-1 min-w-32">
      <button
        onClick={() => setRenaming(true)}
        className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left"
      >
        이름 변경
      </button>
      <button
        onClick={() => deleteNotebook.mutate({ id: notebook.id })}
        disabled={deleteNotebook.isPending}
        className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left disabled:opacity-50"
      >
        삭제
      </button>
    </div>
  );
}
