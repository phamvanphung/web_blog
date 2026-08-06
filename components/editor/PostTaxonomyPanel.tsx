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
    <aside className="space-y-6 border-l border-line pl-6">
      <div>
        <h3 className="mb-2 text-sm font-semibold">Chủ đề</h3>
        {categories.length === 0 ? (
          <p className="text-xs text-muted">Chưa có category. Tạo ở /admin/categories.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {categories.map((c) => (
              <li key={c.id}>
                <label className="flex cursor-pointer items-center gap-2">
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
        <h3 className="mb-2 text-sm font-semibold">Tags</h3>
        {tags.length === 0 ? (
          <p className="text-xs text-muted">Chưa có tag. Tạo ở /admin/tags.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {tags.map((t) => (
              <li key={t.id}>
                <label className="flex cursor-pointer items-center gap-2">
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
        <h3 className="mb-2 text-sm font-semibold">Ảnh đại diện</h3>
        {recentMedia.length === 0 ? (
          <p className="text-xs text-muted">Chưa có media. Upload ở /admin/media.</p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setFeaturedMediaId(null)}
              className={`flex aspect-square items-center justify-center border ${
                featuredMediaId === null ? 'border-accent' : 'border-line'
              }`}
              title="Không có ảnh đại diện"
            >
              <span className="text-xs text-muted">∅</span>
            </button>
            {recentMedia.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setFeaturedMediaId(m.id)}
                className={`aspect-square overflow-hidden border ${
                  featuredMediaId === m.id ? 'border-accent' : 'border-line'
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
        <p className="border-t border-line pt-4 text-xs text-muted">
          Taxonomy sẽ được lưu khi bạn click <strong>Lưu nháp</strong>.
        </p>
      )}
    </aside>
  );
}
