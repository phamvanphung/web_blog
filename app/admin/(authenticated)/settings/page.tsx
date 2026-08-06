import { requireRole } from '@/lib/auth';
import { listSettings } from '@/modules/settings/server';
import { SettingRow } from './SettingRow';

// Server-rendered (DB read on each request). force-dynamic so build doesn't
// try to pre-render before MySQL is wired.
export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  await requireRole('ADMIN');
  const settings = await listSettings();

  return (
    <div>
      <h1 className="mb-2 text-d-sm">Settings</h1>
      <p className="mb-8 text-[13px] text-ink-48">
        Admin-only. Key/value store cho site name, tagline, social, analytics, …
      </p>

      {settings.length === 0 ? (
        <p className="text-[13px] text-ink-48">Chưa có setting nào.</p>
      ) : (
        <div className="max-w-prose space-y-4">
          {settings.map((s) => (
            <SettingRow
              key={s.key}
              keyName={s.key}
              value={s.value}
              updatedAt={s.updatedAt.toISOString()}
            />
          ))}
        </div>
      )}
    </div>
  );
}
