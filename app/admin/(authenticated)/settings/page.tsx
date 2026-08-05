import { requireRole } from '@/lib/auth';
import { listSettings } from '@/modules/settings/server';
import { updateSettingAction } from './actions';

// Server-rendered (DB read on each request). force-dynamic so build doesn't
// try to pre-render before MySQL is wired.
export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  await requireRole('ADMIN');
  const settings = await listSettings();

  return (
    <div>
      <h1 className="mb-2 text-3xl">Settings</h1>
      <p className="mb-8 text-sm text-muted">
        Admin-only. Key/value store cho site name, tagline, social, analytics, …
      </p>

      {settings.length === 0 ? (
        <p className="text-sm text-muted">Chưa có setting nào.</p>
      ) : (
        <div className="space-y-4 max-w-prose">
          {settings.map((s) => (
            <form
              key={s.key}
              action={updateSettingAction}
              className="space-y-1 border-b border-line pb-4"
            >
              <label
                className="block text-xs uppercase tracking-wider text-muted"
                htmlFor={`k-${s.key}`}
              >
                {s.key}
              </label>
              <input id={`k-${s.key}`} type="hidden" name="key" value={s.key} />
              <input
                name="value"
                defaultValue={s.value}
                className="w-full border border-line bg-bg px-3 py-2 text-sm"
              />
              <p className="text-xs text-muted">Cập nhật: {s.updatedAt.toISOString()}</p>
              <button type="submit" className="border border-line px-3 py-1 text-sm hover:bg-line/40">
                Lưu
              </button>
            </form>
          ))}
        </div>
      )}
    </div>
  );
}
