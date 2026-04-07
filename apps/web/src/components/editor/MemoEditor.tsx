'use client';

import { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { trpc } from '@/lib/trpc';
import { EditorToolbar } from './EditorToolbar';
import { SaveIndicator } from './SaveIndicator';

type SaveStatus = 'idle' | 'saving' | 'saved';

export function MemoEditor({ memoId, initialContent }: { memoId: string; initialContent: string }) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSaved = useRef(initialContent);
  const utils = trpc.useUtils();

  const updateMemo = trpc.memo.update.useMutation({
    onSuccess: () => {
      setSaveStatus('saved');
      utils.memo.list.invalidate();
    },
  });

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: '메모를 입력하세요...' }),
    ],
    content: initialContent ? (JSON.parse(initialContent) as object) : '',
    onUpdate: ({ editor }) => {
      const json = JSON.stringify(editor.getJSON());
      if (json === lastSaved.current) return;

      setSaveStatus('saving');
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        lastSaved.current = json;
        updateMemo.mutate({ id: memoId, content: json });
      }, 1000);
    },
  });

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  if (!editor) return null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
        <EditorToolbar editor={editor} />
        <SaveIndicator status={saveStatus} />
      </div>
      <EditorContent
        editor={editor}
        className="flex-1 overflow-y-auto px-8 py-6 prose prose-sm max-w-none focus:outline-none"
      />
    </div>
  );
}
