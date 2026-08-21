import { requireRole } from '@/lib/auth';
import { listSettings } from '@/modules/settings/server';
import { SettingKey } from '@/modules/settings/types';
import { SettingRow } from './SettingRow';
import { SETTING_META, GROUP_LABELS, type SettingMeta } from './SettingMeta';

// Server-rendered (DB read on each request). force-dynamic so build doesn't
// try to pre-render before MySQL is wired.
export const dynamic = 'force-dynamic';

type Row = {
  key: SettingKey;
  /** null if the key has never been written to the DB yet. */
  value: string | null;
  updatedAt: string | null;
};

export default async function SettingsPage() {
  await requireRole('ADMIN');
  const dbRows = await listSettings();

  // Build a complete view: every known SettingKey shows up, even if the
  // DB has never seen it. Ghost rows render an empty input; saving
  // `upsert`s a real row.
  const byKey = new Map<string, { value: string; updatedAt: Date }>();
  for (const r of dbRows) byKey.set(r.key, { value: r.value, updatedAt: r.updatedAt });

  const all: Row[] = (Object.keys(SETTING_META) as SettingKey[]).map((k) => {
    const hit = byKey.get(k);
    return {
      key: k,
      value: hit?.value ?? null,
      updatedAt: hit ? hit.updatedAt.toISOString() : null
    };
  });

  // Group rows by category for a less noisy admin.
  const groups = new Map<SettingMeta['group'], Row[]>();
  for (const r of all) {
    const meta = SETTING_META[r.key];
    const arr = groups.get(meta.group) ?? [];
    arr.push(r);
    groups.set(meta.group, arr);
  }

  return (
    <div>
      <h1 className="mb-2 text-d-sm">Settings</h1>
      <p className="mb-8 text-[13px] text-ink-48">
        Admin-only. Key/value store cho site name, tagline, social, analytics, …
      </p>

      {all.length === 0 ? (
        <p className="text-[13px] text-ink-48">Chưa có setting nào.</p>
      ) : (
        <div className="max-w-prose space-y-10">
          {Array.from(groups.entries()).map(([group, rows]) => (
            <section key={group}>
              <h2 className="mb-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-48">
                {GROUP_LABELS[group]}
              </h2>
              <div className="space-y-6">
                {rows.map((r) => {
                  const meta = SETTING_META[r.key];
                  return (
                    <SettingRow
                      key={r.key}
                      keyName={r.key}
                      label={meta.label}
                      description={meta.description}
                      value={r.value ?? ''}
                      updatedAt={r.updatedAt ?? ''}
                    />
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}