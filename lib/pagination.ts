// lib/pagination.ts
// Tiny `?page=N` helpers.

export function parsePage(raw: string | null | undefined): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

export type PageInfo = {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
};

export function paginate(total: number, page: number, pageSize: number): PageInfo {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  return { page, pageSize, pageCount, total };
}
