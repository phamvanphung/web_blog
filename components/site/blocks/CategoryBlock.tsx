import Link from 'next/link';
import type { CategoriesSection } from '@/modules/pages/types';
import { listCategoriesByGroupSlug } from '@/modules/categories/server/public';
import { Tile } from '@/components/ui/Tile';
import { Container } from '@/components/ui/Container';

type Props = CategoriesSection['data'];

const LAYOUT_CLASSES: Record<Props['layout'], string> = {
  'grid-2': 'sm:grid-cols-2',
  'grid-3': 'sm:grid-cols-2 lg:grid-cols-3',
  'grid-4': 'sm:grid-cols-2 lg:grid-cols-4'
};

export async function CategoryBlock(props: Props) {
  const cats = await listCategoriesByGroupSlug(
    props.groupSlug,
    props.limit,
    props.orderBy
  );
  if (cats.length === 0) return null;

  const cols = LAYOUT_CLASSES[props.layout];

  return (
    <Tile tone="parchment">
      <Container width="comfortable" className="py-section">
        {props.heading && (
          <h2 className="text-center text-d-md">{props.heading}</h2>
        )}
        {props.body && (
          <p className="mt-md text-center text-[17px] text-ink-muted-80">{props.body}</p>
        )}
        <div className={`mt-lg grid grid-cols-1 ${cols} gap-4`}>
          {cats.map((c) => (
            <Link
              key={c.id}
              href={`/chu-de/${c.slug}`}
              className="group flex flex-col rounded-11 border border-hairline bg-canvas p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="mb-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-canvas-parchment text-[12px] text-ink-muted-80">
                ●
              </span>
              <span className="text-[15px] font-medium text-ink">{c.name}</span>
              {c.description && (
                <span className="mt-1 line-clamp-2 text-[13px] text-ink-muted-80">
                  {c.description}
                </span>
              )}
              <span className="mt-auto pt-3 text-[13px] text-primary group-hover:underline">
                Xem chi tiết →
              </span>
            </Link>
          ))}
        </div>
        {props.showAll && cats.length >= props.limit && (
          <div className="mt-lg text-center">
            <Link
              href="/chu-de"
              className="button-pill secondary"
            >
              Xem tất cả
            </Link>
          </div>
        )}
      </Container>
    </Tile>
  );
}
