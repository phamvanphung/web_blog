import { Tiptap } from '@/components/editor/Tiptap';

export default function NewPostPage() {
  // Empty Tiptap doc — must be valid Tiptap JSON shape.
  const empty = { type: 'doc', content: [{ type: 'paragraph' }] };
  return (
    <div>
      <h1 className="mb-2 text-3xl">Bài viết mới</h1>
      <p className="mb-6 text-sm text-muted">
        Autosave sẽ tạo draft sau lần gõ đầu tiên. Publish từ trang edit sau khi soạn xong.
      </p>
      <Tiptap initialContent={empty} postId={null} />
    </div>
  );
}
