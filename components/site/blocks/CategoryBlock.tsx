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
    <Tile tone="light">
      <Container width="comfortable" className="py-section">
        {props.heading && (
          <h2 className="text-center text-d-md">{props.heading}</h2>
        )}
        {props.body && (
          <p className="mt-md text-center text-[17px] text-ink-muted-80">{props.body}</p>
        )}
        <ul className={`mt-lg grid grid-cols-1 ${cols} gap-4`}>
          {cats.map((c) => (
            <li
              key={c.id}
              className="rounded-18 border border-hairline bg-canvas p-6 transition-colors hover:bg-canvas-parchment"
            >
              <Link href={`/chu-de/${c.slug}`} className="block">
                <span className="block text-[21px] font-semibold tracking-tight text-ink hover:text-primary">
                  {c.name}
                </span>
                {c.description && (
                  <p className="mt-3 text-[15px] leading-snug text-ink-80 line-clamp-3">
                    {c.description}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
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
