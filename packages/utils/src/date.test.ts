import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { formatDateHeader } from './date';

describe('formatDateHeader', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-02T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('"오늘"을 반환한다', () => {
    expect(formatDateHeader(new Date('2026-04-02T09:00:00'))).toBe('오늘');
  });

  it('"어제"를 반환한다', () => {
    expect(formatDateHeader(new Date('2026-04-01T09:00:00'))).toBe('어제');
  });

  it('더 오래된 날짜는 "M월 D일" 형식을 반환한다', () => {
    expect(formatDateHeader(new Date('2026-03-15'))).toBe('3월 15일');
  });
});
