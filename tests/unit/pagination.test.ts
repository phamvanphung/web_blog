import { describe, it, expect } from 'vitest';
import { parsePage, paginate } from '@/lib/pagination';

describe('pagination', () => {
  it('parsePage handles invalid', () => {
    expect(parsePage(null)).toBe(1);
    expect(parsePage('abc')).toBe(1);
    expect(parsePage('0')).toBe(1);
    expect(parsePage('-5')).toBe(1);
    expect(parsePage('3')).toBe(3);
  });
  it('paginate computes pageCount', () => {
    expect(paginate(0, 1, 12)).toEqual({ page: 1, pageSize: 12, pageCount: 1, total: 0 });
    expect(paginate(25, 1, 12)).toEqual({ page: 1, pageSize: 12, pageCount: 3, total: 25 });
    expect(paginate(25, 3, 12)).toEqual({ page: 3, pageSize: 12, pageCount: 3, total: 25 });
  });
});
