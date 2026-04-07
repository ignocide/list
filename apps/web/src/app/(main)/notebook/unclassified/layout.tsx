import { MemoList } from '@/components/memo/MemoList';

export default function UnclassifiedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 overflow-hidden">
      <MemoList notebookId={null} notebookSlug="unclassified" />
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
