'use client';

import { Editor } from '@tiptap/react';

export function EditorToolbar({ editor }: { editor: Editor }) {
  const btn = (active: boolean) =>
    `px-2 py-1 rounded text-sm font-medium transition-colors ${
      active ? 'bg-gray-200 text-gray-900' : 'text-gray-500 hover:bg-gray-100'
    }`;

  return (
    <div className="flex items-center gap-1 px-3 py-2">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={btn(editor.isActive('bold'))}
      >
        B
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={btn(editor.isActive('italic'))}
      >
        I
      </button>
      <div className="w-px h-4 bg-gray-200 mx-1" />
      {[1, 2, 3].map((level) => (
        <button
          key={level}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 }).run()
          }
          className={btn(editor.isActive('heading', { level }))}
        >
          H{level}
        </button>
      ))}
      <div className="w-px h-4 bg-gray-200 mx-1" />
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={btn(editor.isActive('bulletList'))}
      >
        •
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={btn(editor.isActive('orderedList'))}
      >
        1.
      </button>
      <div className="w-px h-4 bg-gray-200 mx-1" />
      <button
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={btn(editor.isActive('code'))}
      >
        {'<>'}
      </button>
      <button
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={btn(editor.isActive('codeBlock'))}
      >
        {'```'}
      </button>
    </div>
  );
}
