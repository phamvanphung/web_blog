'use client';

import { useState } from 'react';

type Category = { id: string; name: string; slug: string };
type Tag = { id: string; name: string; slug: string };
type Media = { id: string; url: string; altText: string | null };

type Props = {
  postId: string | null;
  initialCategoryIds: string[];
  initialTagIds: string[];
  initialFeaturedMediaId: string | null;
  categories: Category[];
  tags: Tag[];
  recentMedia: Media[];
};

const checkboxLabel =
  'flex cursor-pointer items-center gap-2 rounded-8 px-2 py-1 text-[14px] text-ink-80 hover:bg-canvas-parchment';

/**
 * Sidebar for picking categories/tags + featured media. State is mirrored to
 * `window.__postTaxonomy` so the Tiptap editor can read it on save
 * (avoids prop-drilling through a deep client boundary).
 */
export function PostTaxonomyPanel({
  postId,
  initialCategoryIds,
  initialTagIds,
  initialFeaturedMediaId,
  categories,
  tags,
  recentMedia
}: Props) {
  const [categoryIds, setCategoryIds] = useState<string[]>(initialCategoryIds);
  const [tagIds, setTagIds] = useState<string[]>(initialTagIds);
  const [featuredMediaId, setFeaturedMediaId] = useState<string | null>(initialFeaturedMediaId);

  // Mirror to window so Tiptap can ship the latest selection on save.
  if (typeof window !== 'undefined') {
    (window as unknown as { __postTaxonomy?: unknown }).__postTaxonomy = {
      categoryIds,
      tagIds,
      featuredMediaId
    };
  }

  function toggleCategory(id: string) {
    setCategoryIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }
  function toggleTag(id: string) {
    setTagIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  return (
    <aside className="space-y-6 rounded-18 border border-hairline bg-canvas-parchment p-5">
      <div>
        <h3 className="mb-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-48">
          Chủ đề
        </h3>
        {categories.length === 0 ? (
          <p className="text-[12px] text-ink-48">Chưa có category. Tạo ở /admin/categories.</p>
        ) : (
          <ul className="space-y-1">
            {categories.map((c) => (
              <li key={c.id}>
                <label className={checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={categoryIds.includes(c.id)}
                    onChange={() => toggleCategory(c.id)}
                  />
                  {c.name}
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h3 className="mb-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-48">
          Tags
        </h3>
        {tags.length === 0 ? (
          <p className="text-[12px] text-ink-48">Chưa có tag. Tạo ở /admin/tags.</p>
        ) : (
          <ul className="space-y-1">
            {tags.map((t) => (
              <li key={t.id}>
                <label className={checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={tagIds.includes(t.id)}
                    onChange={() => toggleTag(t.id)}
                  />
                  {t.name}
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h3 className="mb-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-48">
          Ảnh đại diện
        </h3>
        {recentMedia.length === 0 ? (
          <p className="text-[12px] text-ink-48">Chưa có media. Upload ở /admin/media.</p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setFeaturedMediaId(null)}
              className={`flex aspect-square items-center justify-center rounded-8 border-2 transition-colors ${
                featuredMediaId === null
                  ? 'border-primary'
                  : 'border-transparent bg-canvas hover:border-hairline'
              }`}
              title="Không có ảnh đại diện"
            >
              <span className="text-[12px] text-ink-48">∅</span>
            </button>
            {recentMedia.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setFeaturedMediaId(m.id)}
                className={`aspect-square overflow-hidden rounded-8 border-2 transition-colors ${
                  featuredMediaId === m.id
                    ? 'border-primary'
                    : 'border-transparent bg-canvas hover:border-hairline'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.url} alt={m.altText ?? ''} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {postId && (
        <p className="border-t border-hairline pt-4 text-[12px] text-ink-48">
          Taxonomy sẽ được lưu khi bạn click <strong className="text-ink">Lưu</strong>.
        </p>
      )}
    </aside>
  );
}
