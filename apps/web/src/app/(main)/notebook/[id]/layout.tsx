import { MemoList } from '@/components/memo/MemoList';

export default async function NotebookLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="flex flex-1 overflow-hidden">
      <MemoList notebookId={id} notebookSlug={id} />
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
