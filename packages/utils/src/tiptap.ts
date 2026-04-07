function extractText(node: { text?: string; content?: object[] }): string {
  if (node.text) return node.text;
  if (node.content) return node.content.map(extractText as any).join('');
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
    const nodes: object[] = doc?.content ?? [];
    for (let i = 1; i < nodes.length; i++) {
      const text = extractText(nodes[i] as any);
      if (text) return text.length > 80 ? text.slice(0, 80) + '…' : text;
    }
    return '';
  } catch {
    return '';
  }
}
