import { describe, it, expect } from 'vitest';
import { extractTitle, extractPreview } from './markdown';

describe('extractTitle', () => {
  it('첫 번째 줄을 제목으로 반환한다', () => {
    expect(extractTitle('오늘 할 일\n- 장보기\n- 운동')).toBe('오늘 할 일');
  });

  it('마크다운 헤딩 기호를 제거한다', () => {
    expect(extractTitle('# 제목\n본문')).toBe('제목');
    expect(extractTitle('## 소제목\n본문')).toBe('소제목');
  });

  it('빈 content에 빈 문자열을 반환한다', () => {
    expect(extractTitle('')).toBe('');
  });

  it('줄이 하나뿐일 때 그 줄을 반환한다', () => {
    expect(extractTitle('단일 줄')).toBe('단일 줄');
  });
});

describe('extractPreview', () => {
  it('두 번째 줄부터 미리보기를 반환한다', () => {
    expect(extractPreview('제목\n미리보기 내용')).toBe('미리보기 내용');
  });

  it('80자를 초과하면 잘라낸다', () => {
    const preview = extractPreview('제목\n' + 'a'.repeat(100));
    expect(preview.length).toBeLessThanOrEqual(81);
  });

  it('두 번째 줄이 없으면 빈 문자열을 반환한다', () => {
    expect(extractPreview('제목만')).toBe('');
  });
});
