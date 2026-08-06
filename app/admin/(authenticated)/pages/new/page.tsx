import { PageForm } from '../PageForm';
import { createPageAction } from '../actions';

export default function NewPagePage() {
  return (
    <div>
      <h1 className="mb-2 text-d-sm">Trang mới</h1>
      <p className="mb-6 text-[13px] text-ink-48">
        Tạo trang tĩnh (plain text). Slug tự sinh từ tiêu đề.
      </p>
      <PageForm mode="create" action={createPageAction} />
    </div>
  );
}
