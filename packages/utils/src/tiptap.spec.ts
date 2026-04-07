import { describe, it, expect } from 'vitest';
import { extractTitle, extractPreview } from './tiptap';

const doc = (nodes: object[]) =>
  JSON.stringify({ type: 'doc', content: nodes });

const heading = (text: string, level = 1) => ({
  type: 'heading',
  attrs: { level },
  content: [{ type: 'text', text }],
});

const paragraph = (text: string) => ({
  type: 'paragraph',
  content: [{ type: 'text', text }],
});

describe('extractTitle', () => {
  it('빈 문자열이면 제목 없음 반환', () => {
    expect(extractTitle('')).toBe('제목 없음');
  });

  it('첫 노드가 heading이면 그 텍스트 반환', () => {
    expect(extractTitle(doc([heading('할 일 목록')]))).toBe('할 일 목록');
  });

  it('첫 노드가 paragraph이면 그 텍스트 반환', () => {
    expect(extractTitle(doc([paragraph('오늘의 일기')]))).toBe('오늘의 일기');
  });

  it('JSON 파싱 실패 시 제목 없음 반환', () => {
    expect(extractTitle('not-json')).toBe('제목 없음');
  });

  it('content 없는 빈 doc은 제목 없음 반환', () => {
    expect(extractTitle(doc([]))).toBe('제목 없음');
  });
});

describe('extractPreview', () => {
  it('빈 문자열이면 빈 문자열 반환', () => {
    expect(extractPreview('')).toBe('');
  });

  it('첫 노드 이후 첫 번째 paragraph 텍스트 반환', () => {
    const content = doc([heading('제목'), paragraph('본문 내용')]);
    expect(extractPreview(content)).toBe('본문 내용');
  });

  it('노드가 하나뿐이면 빈 문자열 반환', () => {
    expect(extractPreview(doc([heading('제목만')]))).toBe('');
  });

  it('80자 초과 시 자름', () => {
    const longText = 'a'.repeat(90);
    const content = doc([heading('제목'), paragraph(longText)]);
    const result = extractPreview(content);
    expect(result).toHaveLength(81); // 80 + '…'
    expect(result.endsWith('…')).toBe(true);
  });
});
