'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { Notebook } from '@nook/types';
import { trpc } from '@/lib/trpc';
import { NotebookContextMenu } from './NotebookContextMenu';

export function NotebookItem({ notebook, active }: { notebook: Notebook; active: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const updatePrefs = trpc.auth.updatePreferences.useMutation();

  return (
    <div className="relative">
      <Link
        href={`/notebook/${notebook.id}`}
        onClick={() => updatePrefs.mutate({ lastNotebookId: notebook.id })}
        onContextMenu={(e) => { e.preventDefault(); setMenuOpen(true); }}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
          active ? 'bg-gray-200 text-gray-900 font-medium' : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: notebook.color }}
        />
        <span className="truncate">{notebook.name}</span>
      </Link>
      {menuOpen && (
        <NotebookContextMenu notebook={notebook} onClose={() => setMenuOpen(false)} />
      )}
    </div>
  );
}
