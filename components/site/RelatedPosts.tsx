// components/site/RelatedPosts.tsx
import { PostCard } from './PostCard';

type Post = {
  title: string;
  slug: string;
  excerpt: string | null;
  publishedAt: Date | null;
};

export function RelatedPosts({ posts }: { posts: Post[] }) {
  if (posts.length === 0) return null;
  return (
    <section className="mt-section border-t border-hairline pt-12">
      <h2 className="mb-6 text-d-sm">Bài liên quan</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {posts.map((p) => (
          <PostCard key={p.slug} post={p} variant="card" />
        ))}
      </div>
    </section>
  );
}
