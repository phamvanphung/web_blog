import { listCategoryGroupsForAdmin } from '@/modules/categories/server';
import { PageFormClient } from './PageFormClient';
import type { Section } from '@/modules/pages/types';

export async function PageForm(props: {
  initial?: { id?: string; title?: string; status?: 'DRAFT' | 'PUBLISHED' | 'HIDDEN'; sections?: Section[] };
}) {
  const groups = await listCategoryGroupsForAdmin();
  return (
    <PageFormClient
      initial={props.initial}
      groups={groups.map((g) => ({ slug: g.slug, name: g.name }))}
    />
  );
}
