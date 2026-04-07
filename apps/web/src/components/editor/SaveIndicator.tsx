'use client';

type Status = 'idle' | 'saving' | 'saved';

export function SaveIndicator({ status }: { status: Status }) {
  if (status === 'idle') return null;
  return (
    <span className="text-xs text-gray-400">
      {status === 'saving' ? '저장 중...' : '저장됨'}
    </span>
  );
}
