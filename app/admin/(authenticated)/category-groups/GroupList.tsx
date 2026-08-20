import { listGroups, countGroupCategories } from '@/modules/category-groups/server';
import { GroupRow } from './GroupRow';

export async function GroupList() {
  const groups = await listGroups();
  const counts = await Promise.all(
    groups.map(async (g) => ({ id: g.id, n: await countGroupCategories(g.id) }))
  );
  const countMap = new Map(counts.map((c) => [c.id, c.n]));

  if (groups.length === 0) {
    return <p className="text-[13px] text-ink-48">Chưa có group nào.</p>;
  }

  return (
    <ul className="space-y-1 text-[13px]">
      {groups.map((g) => (
        <GroupRow
          key={g.id}
          group={g}
          refCount={countMap.get(g.id) ?? 0}
        />
      ))}
    </ul>
  );
}
