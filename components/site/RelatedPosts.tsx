// components/site/RelatedPosts.tsx
import { PostCard } from './PostCard';

type Post = { title: string; slug: string; excerpt: string | null; publishedAt: Date | null };

export function RelatedPosts({ posts }: { posts: Post[] }) {
  if (posts.length === 0) return null;
  return (
    <section className="mt-16 border-t border-line pt-8">
      <h2 className="mb-4 text-xl">Bài liên quan</h2>
      <div>
        {posts.map((p) => (
          <PostCard key={p.slug} post={p} />
        ))}
      </div>
    </section>
  );
}
