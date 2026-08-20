import { requireRole } from '@/lib/auth';
import { GroupForm } from './GroupForm';
import { GroupList } from './GroupList';

export const dynamic = 'force-dynamic';

export default async function CategoryGroupsPage() {
  await requireRole('ADMIN');
  return (
    <div>
      <h1 className="mb-2 text-d-sm">Category Groups</h1>
      <p className="mb-8 text-[13px] text-ink-48">
        Quản lý các nhóm (company, personal, …). Mỗi Category có thể thuộc một group
        hoặc không (mặc định). Group <code>default</code> được bảo vệ, không xóa được.
      </p>

      <GroupForm />

      <h2 className="mb-3 mt-12 text-[21px] font-semibold tracking-tight">
        Groups hiện tại
      </h2>
      <GroupList />
    </div>
  );
}
