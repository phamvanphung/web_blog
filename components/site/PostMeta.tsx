// components/site/PostMeta.tsx
import Link from 'next/link';

type Props = {
  publishedAt: Date | null;
  authorName: string;
  categories: { id: string; name: string; slug: string }[];
  tags: { id: string; name: string; slug: string }[];
};

const DATE_FMT = new Intl.DateTimeFormat('vi-VN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});

export function PostMeta({ publishedAt, authorName, categories, tags }: Props) {
  return (
    <div className="text-sm text-muted">
      {publishedAt && (
        <time dateTime={publishedAt.toISOString()}>{DATE_FMT.format(publishedAt)}</time>
      )}
      <span className="mx-2">·</span>
      <span>{authorName}</span>
      {categories.length > 0 && (
        <>
          <span className="mx-2">·</span>
          <span>
            {categories.map((c, i) => (
              <span key={c.id}>
                <Link href={`/chu-de/${c.slug}`} className="hover:text-accent">
                  {c.name}
                </Link>
                {i < categories.length - 1 ? ', ' : ''}
              </span>
            ))}
          </span>
        </>
      )}
      {tags.length > 0 && (
        <div className="mt-2">
          {tags.map((t) => (
            <Link
              key={t.id}
              href={`/tag/${t.slug}`}
              className="mr-2 underline hover:no-underline"
            >
              #{t.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
