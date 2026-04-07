type TipTapNode = { text?: string; content?: TipTapNode[] };

function extractText(node: TipTapNode): string {
  if (typeof node.text === 'string') return node.text;
  if (node.content) return node.content.map(extractText).join('');
  return '';
}

export function extractTitle(content: string): string {
  if (!content) return '제목 없음';
  try {
    const doc = JSON.parse(content);
    const firstNode = doc?.content?.[0];
    if (!firstNode) return '제목 없음';
    return extractText(firstNode) || '제목 없음';
  } catch {
    return '제목 없음';
  }
}

export function extractPreview(content: string): string {
  if (!content) return '';
  try {
    const doc = JSON.parse(content);
    const nodes: TipTapNode[] = doc?.content ?? [];
    for (let i = 1; i < nodes.length; i++) {
      const text = extractText(nodes[i]);
      if (text) return text.length > 80 ? text.slice(0, 80) + '…' : text;
    }
    return '';
  } catch {
    return '';
  }
}
