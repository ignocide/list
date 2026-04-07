'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { extractTitle, extractPreview, formatDateHeader } from '@nook/utils';
import type { Memo } from '@nook/types';
import { MemoContextMenu } from './MemoContextMenu';

export function MemoItem({ memo, notebookSlug }: { memo: Memo; notebookSlug: string }) {
  const pathname = usePathname();
  const isActive = pathname.includes(`/memo/${memo.id}`);
  const [menuOpen, setMenuOpen] = useState(false);

  const title = extractTitle(memo.content) || '제목 없음';
  const preview = extractPreview(memo.content);
  const date = formatDateHeader(new Date(memo.updatedAt));

  return (
    <div className="relative">
      <Link
        href={`/notebook/${notebookSlug}/memo/${memo.id}`}
        onContextMenu={(e) => {
          e.preventDefault();
          setMenuOpen(true);
        }}
        className={`block px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
          isActive ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''
        }`}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-gray-900 truncate">{title}</span>
          <span className="text-xs text-gray-400 ml-2 flex-shrink-0">{date}</span>
        </div>
        {preview && (
          <p className="text-xs text-gray-500 truncate">{preview}</p>
        )}
      </Link>
      {menuOpen && (
        <MemoContextMenu
          memoId={memo.id}
          notebookId={memo.notebookId}
          onClose={() => setMenuOpen(false)}
        />
      )}
    </div>
  );
}
