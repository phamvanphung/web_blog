'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MediaCard } from './MediaCard';
import { loadMoreMediaAction } from './actions';

// ============================================================
// MediaGrid (client)
// ============================================================
//
// Wraps the gallery grid + drives infinite scroll. Items render as a flat
// list of `<MediaCard>`s so the hover/lightbox/copy-link UX from before is
// unchanged per row.
//
// Infinite-scroll strategy:
//   - The first page comes pre-rendered from the server (passed in via
//     `initialItems`) — keeps SSR for above-the-fold, no client-side refetch
//     on mount.
//   - A sentinel <div> sits at the bottom of the list. An
//     IntersectionObserver fires `loadMore` whenever the sentinel scrolls
//     into view (with a 200px rootMargin so the next batch starts loading
//     *before* the user actually reaches the bottom).
//   - Each call to loadMoreMediaAction returns `{ items, hasMore }`. When
//     `hasMore === false` we tear down the observer and stop.
//   - `deleteMediaFormAction` is wired through unchanged. Deleting a card
//     while a fetch is in-flight does not affect the load (the drop is
//     local state; the next page render won't have the deleted row anyway).
//
// Why skip-based and not cursor: dataset is small (sketch ceiling ~10k),
// and the queries are on a covered (id, createdAt desc) index. If the
// table grows past that, switch the action to a createdAt cursor — the
// client doesn't care.

type MediaItem = {
  id: string;
  url: string;
  altText: string | null;
  originalName: string;
  width: number | null;
  height: number | null;
  fileSize: number;
  createdAt: string;
};

type Props = {
  initialItems: MediaItem[];
  deleteAction: (formData: FormData) => void | Promise<void>;
};

export function MediaGrid({ initialItems, deleteAction }: Props) {
  const [items, setItems] = useState<MediaItem[]>(initialItems);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  // Tracks whether a delete happened between render and a still-pending
  // load response. We re-check after the response resolves.
  const skipRef = useRef(initialItems.length);
  const inFlightRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadMore = useCallback(async () => {
    if (inFlightRef.current || !hasMore) return;
    inFlightRef.current = true;
    setLoading(true);
    try {
      const result = await loadMoreMediaAction(skipRef.current);
      // If a delete happened during the in-flight call the user will have
      // re-rendered with a smaller list already; we still append (dups are
      // impossible because deletes are local-only and the DB id stays
      // stable across pages).
      setItems((prev) => [...prev, ...result.items]);
      skipRef.current += result.items.length;
      setHasMore(result.hasMore);
    } finally {
      setLoading(false);
      inFlightRef.current = false;
    }
  }, [hasMore]);

  // Observe the sentinel. Re-arm the observer whenever `loading` or
  // `hasMore` changes so the IntersectionObserver state matches the model
  // (some browsers cache "isIntersecting" across callbacks when the
  // observed element is replaced in the DOM, so we re-bind on every change).
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) void loadMore();
      },
      { rootMargin: '0px 0px 200px 0px' }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [hasMore, loading, loadMore]);

  return (
    <>
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {items.map((m) => (
          <MediaCard
            key={m.id}
            id={m.id}
            url={m.url}
            altText={m.altText}
            originalName={m.originalName}
            width={m.width}
            height={m.height}
            fileSize={m.fileSize}
            deleteAction={deleteAction}
          />
        ))}
      </ul>

      {/* Sentinel + end-of-list affordance. The sentinel stays in the DOM
          even when empty so the user can still scroll past the last row. */}
      <div
        ref={sentinelRef}
        aria-hidden="true"
        className="mt-6 flex h-10 items-center justify-center text-[13px] text-ink-48"
      >
        {loading
          ? 'Đang tải…'
          : hasMore
            ? ''
            : 'Đã hết ảnh.'}
      </div>
    </>
  );
}
