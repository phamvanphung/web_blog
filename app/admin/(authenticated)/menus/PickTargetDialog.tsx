// app/admin/(authenticated)/menus/PickTargetDialog.tsx
//
// Search-backed picker for menu item targets. Replaces the previous
// inline `<select>` in `TargetField` so the menu editor stays snappy
// even with thousands of posts/pages/categories — the dialog fetches
// pages from `/api/internal/menu-targets` as the user types, with
// debounced search and Previous/Next page navigation.
//
// Built on the platform-native `<dialog>` element opened via
// `showModal()`. That gives us, for free, focus-trap, Escape-to-close,
// and a backdrop click that closes the modal. No headless-ui / radix
// dependency, matching the rest of this admin codebase.

'use client';

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useTransition
} from 'react';
import { Icon } from '@/components/ui/Icon';
import type { TargetType } from './TargetField';

type SearchItem = { id: string; label: string };
type SearchResult = {
  items: SearchItem[];
  page: number;
  pageSize: number;
  total: number;
};

const TYPE_NOUN: Record<Exclude<TargetType, 'EXTERNAL'>, string> = {
  PAGE: 'trang',
  POST: 'bài viết',
  CATEGORY: 'chủ đề'
};

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 250;

type Props = {
  type: Exclude<TargetType, 'EXTERNAL'>;
  /** Currently-picked id. `null` when none. */
  value: string | null;
  /** Pre-resolved label for `value`, when known server-side. Used to
      render the trigger button label without a round-trip on first paint.
      Optional — the dialog will fall back to a truncated id if missing. */
  currentLabel?: string | null;
  /** Fired when the user clicks a row. Parent should update its
      controlled `targetId` state here. */
  onPick: (id: string, label: string) => void;
};

function shortId(id: string): string {
  return id.length > 10 ? `${id.slice(0, 10)}…` : id;
}

export function PickTargetDialog({
  type,
  value,
  currentLabel,
  onPick
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Debounced search input value — used as the actual `q` for fetches.
  // The textbox itself updates synchronously; the request only fires
  // 250ms after the user stops typing.
  const [debouncedQuery, setDebouncedQuery] = useState('');

  const titleId = useId();

  const open = useCallback(() => {
    dialogRef.current?.showModal();
    setIsOpen(true);
    // Focus the search input on next frame so the dialog is mounted first.
    requestAnimationFrame(() => searchRef.current?.focus());
  }, []);

  const close = useCallback(() => {
    dialogRef.current?.close();
    setIsOpen(false);
    triggerRef.current?.focus();
  }, []);

  // Reset state every time the dialog re-opens.
  useEffect(() => {
    if (!isOpen) return;
    setPage(1);
    setQuery('');
    setDebouncedQuery('');
    setError(null);
  }, [isOpen]);

  // Debounce query → debouncedQuery.
  useEffect(() => {
    if (!isOpen) return;
    const id = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
      setPage(1); // typing a new query resets pagination
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [query, isOpen]);

  // Fetch whenever the typed query (after debounce) or page changes,
  // but only while the dialog is open. Aborts in-flight requests on
  // re-fetch so an older slower response can't overwrite a newer one.
  useEffect(() => {
    if (!isOpen) return;
    const ctrl = new AbortController();
    startTransition(async () => {
      try {
        setError(null);
        const url = new URL('/api/internal/menu-targets', window.location.origin);
        url.searchParams.set('type', type);
        if (debouncedQuery) url.searchParams.set('q', debouncedQuery);
        url.searchParams.set('page', String(page));
        url.searchParams.set('pageSize', String(PAGE_SIZE));
        const res = await fetch(url.toString(), {
          signal: ctrl.signal,
          credentials: 'same-origin',
          headers: { accept: 'application/json' }
        });
        if (!res.ok) {
          setError(`Lỗi ${res.status}`);
          setData(null);
          return;
        }
        const json = (await res.json()) as SearchResult;
        setData(json);
      } catch (e) {
        if ((e as Error).name === 'AbortError') return;
        setError((e as Error).message);
        setData(null);
      }
    });
    return () => ctrl.abort();
    // type / debouncedQuery / page transitions all re-fire.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, type, debouncedQuery, page]);

  const totalPages =
    data && data.total > 0 ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={open}
        className="flex w-full items-center justify-between gap-2 rounded-8 border border-hairline bg-canvas px-3 py-2 text-left text-[13px] text-ink hover:bg-canvas-parchment"
      >
        <span className="min-w-0 truncate">
          {value
            ? currentLabel ?? shortId(value)
            : `— Chọn ${TYPE_NOUN[type]} —`}
        </span>
        <span className="shrink-0 text-[12px] text-primary">Đổi…</span>
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        onClose={() => setIsOpen(false)}
        className="w-[min(640px,92vw)] rounded-18 border border-hairline bg-canvas p-0 text-ink backdrop:bg-ink/40 backdrop:backdrop-blur-sm"
      >
        <div className="space-y-4 p-5">
          <header className="flex items-center justify-between gap-2">
            <h2 id={titleId} className="text-[16px] font-semibold">
              Chọn {TYPE_NOUN[type]}
            </h2>
            <button
              type="button"
              onClick={close}
              aria-label="Đóng"
              className="inline-flex h-8 w-8 items-center justify-center rounded-pill text-ink-80 transition-colors hover:bg-canvas-parchment hover:text-ink"
            >
              <Icon name="close" size={16} />
            </button>
          </header>

          <div className="relative">
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.currentTarget.value)}
              placeholder={`Tìm theo title / name / slug…`}
              className="h-10 w-full rounded-11 bg-canvas-parchment px-4 text-[14px] text-ink outline-none focus:bg-canvas focus:ring-2 focus:ring-primary-focus"
            />
          </div>

          {error && (
            <p role="alert" className="text-[12px] text-error">
              {error}
            </p>
          )}

          <ul
            aria-busy={isPending}
            className="max-h-[50vh] overflow-y-auto rounded-8 border border-hairline"
          >
            {data?.items.length === 0 && !isPending && (
              <li className="px-3 py-4 text-center text-[13px] text-ink-48">
                Không tìm thấy.
              </li>
            )}
            {data?.items.map((it) => {
              const isSelected = it.id === value;
              return (
                <li key={it.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onPick(it.id, it.label);
                      close();
                    }}
                    aria-pressed={isSelected}
                    className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-[13px] transition-colors hover:bg-canvas-parchment ${
                      isSelected ? 'bg-canvas-parchment' : ''
                    }`}
                  >
                    <span className="min-w-0 truncate">{it.label}</span>
                    {isSelected && (
                      <span className="shrink-0 text-[11px] text-primary">đã chọn</span>
                    )}
                  </button>
                </li>
              );
            })}
            {!data && isPending && (
              <li className="px-3 py-4 text-center text-[13px] text-ink-48">
                Đang tải…
              </li>
            )}
          </ul>

          <footer className="flex items-center justify-between text-[12px] text-ink-80">
            <span>
              {data
                ? `Trang ${page} / ${totalPages} · ${data.total} mục`
                : ' '}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || isPending}
                className="rounded-8 border border-hairline px-3 py-1 text-ink-80 enabled:hover:bg-canvas-parchment disabled:opacity-50"
              >
                Trước
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                disabled={!data || page >= totalPages || isPending}
                className="rounded-8 border border-hairline px-3 py-1 text-ink-80 enabled:hover:bg-canvas-parchment disabled:opacity-50"
              >
                Sau
              </button>
            </div>
          </footer>
        </div>
      </dialog>
    </>
  );
}
