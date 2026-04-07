'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';

const COLORS = ['#868e96', '#e03131', '#f76707', '#2f9e44', '#1971c2', '#7048e8'];

export function NotebookCreateModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const router = useRouter();
  const utils = trpc.useUtils();

  const createNotebook = trpc.notebook.create.useMutation({
    onSuccess: (notebook) => {
      utils.notebook.list.invalidate();
      router.push(`/notebook/${notebook.id}`);
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-80">
        <h2 className="text-base font-semibold mb-4">새 노트북</h2>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && name.trim()) createNotebook.mutate({ name: name.trim(), color });
            if (e.key === 'Escape') onClose();
          }}
          placeholder="노트북 이름"
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 mb-4"
        />
        <div className="flex gap-2 mb-6">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-6 h-6 rounded-full transition-transform ${color === c ? 'scale-125 ring-2 ring-offset-1 ring-gray-400' : ''}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
            취소
          </button>
          <button
            onClick={() => name.trim() && createNotebook.mutate({ name: name.trim(), color })}
            disabled={!name.trim()}
            className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg disabled:opacity-40"
          >
            만들기
          </button>
        </div>
      </div>
    </div>
  );
}
