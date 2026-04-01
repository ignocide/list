export function extractTitle(content: string): string {
  const firstLine = content.split('\n')[0] ?? '';
  return firstLine.replace(/^#+\s*/, '').trim();
}

export function extractPreview(content: string): string {
  const lines = content.split('\n');
  const rest = lines.slice(1).join(' ').trim();
  if (!rest) return '';
  return rest.length > 80 ? rest.slice(0, 80) + '…' : rest;
}
