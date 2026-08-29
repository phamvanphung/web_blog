// components/site/blocks/PostsBlock.tsx
// Server component. Fetches recent posts via `listRecentPosts` (cached on
// `posts:recent`) and renders the configured layout. Mirrors CategoryBlock
// patterns: hide the section entirely when there are no posts; honour the
// editor's heading; no body/footer link by design (Q5 + Q6).

import type { PostsSection } from '@/modules/pages/types';
import { listRecentPosts } from '@/modules/posts/server/public';
import { PostCard } from '@/components/site/PostCard';
import { Tile } from '@/components/ui/Tile';
import { Container } from '@/components/ui/Container';

type Props = PostsSection['data'];

const GRID_COLS_CLASS: Record<NonNullable<Props['cols']>, string> = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4'
};

export async function PostsBlock(props: Props) {
  // Grid mode derives total from cols × rows; list mode uses limit directly.
  // For grid we ignore `limit` and use cols × 2 (rows=2) — the editor's
  // `limit` is interpreted as the visible row count when in grid mode.
  // To keep this single-source-of-truth, we accept the editor's `limit`
  // as the total item count for both modes: list renders `limit` items,
  // grid renders `limit` items arranged in `cols` columns (rows = ceil).
  const total = Math.max(1, Math.min(48, props.limit));

  const posts = await listRecentPosts({
    groupSlug: props.groupSlug?.trim() || undefined,
    limit: total
  });
  if (posts.length === 0) return null;

  const showImage = props.showImage;
  const showTitle = props.showTitle;
  const showExcerpt = props.showExcerpt;
  const headingAlign = props.headingAlign ?? 'center';
  const headingClass = headingAlign === 'left' ? 'text-left' : 'text-center';

  return (
    <Tile tone="light">
      <Container width="comfortable" className="py-section">
        {props.heading && (
          <h2 className={`${headingClass} text-d-md`}>{props.heading}</h2>
        )}

        {props.layout === 'grid' ? (
          <ul
            className={
              'mt-lg grid grid-cols-1 ' +
              GRID_COLS_CLASS[props.cols ?? 3] +
              ' gap-4'
            }
          >
            {posts.map((p) => (
              <li key={p.id}>
                <PostCard
                  post={p}
                  variant="grid-with-image"
                  showImage={showImage}
                  showTitle={showTitle}
                  showExcerpt={showExcerpt}
                />
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-lg">
            {posts.map((p) => (
              <PostCard
                key={p.id}
                post={p}
                variant="list-with-image"
                showImage={showImage}
                showTitle={showTitle}
                showExcerpt={showExcerpt}
              />
            ))}
          </div>
        )}
      </Container>
    </Tile>
  );
}