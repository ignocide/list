'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { NotebookItem } from './NotebookItem';
import { NotebookCreateModal } from './NotebookCreateModal';

export function Sidebar() {
  const { data: notebooks = [] } = trpc.notebook.list.useQuery();
  const [showCreate, setShowCreate] = useState(false);
  const pathname = usePathname();

  return (
    <div className="w-56 h-screen bg-gray-50 border-r border-gray-200 flex flex-col flex-shrink-0">
      <div className="px-4 py-4 flex items-center justify-between">
        <span className="font-bold text-gray-900">Nook</span>
        <button
          onClick={() => setShowCreate(true)}
          className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors text-lg leading-none"
          title="새 노트북"
        >
          +
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5">
        <Link
          href="/notebook/unclassified"
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
            pathname.startsWith('/notebook/unclassified')
              ? 'bg-gray-200 text-gray-900 font-medium'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-gray-400 flex-shrink-0" />
          미분류
        </Link>
        {notebooks.map((nb) => (
          <NotebookItem
            key={nb.id}
            notebook={nb}
            active={pathname.startsWith(`/notebook/${nb.id}`)}
          />
        ))}
      </nav>

      {showCreate && <NotebookCreateModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
