'use client';

import { useEffect, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import { extensionBundle } from './extensions';
import { BubbleMenu } from './BubbleMenu';
import { ImagePickerModal } from './ImagePickerModal';
import { VideoInsertModal } from './VideoInsertModal';

type Props = {
  initialContent: unknown;
  onChange?: (json: unknown) => void;
};

export function EditorCanvas({ initialContent, onChange }: Props) {
  const [imageOpen, setImageOpen] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);

  const editor = useEditor({
    extensions: extensionBundle,
    content: initialContent as never,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-notion max-w-none focus:outline-none min-h-[420px]',
      },
    },
    onUpdate({ editor }) {
      onChange?.(editor.getJSON());
    },
  });

  // Listen for modalRequest meta on transactions.
  useEffect(() => {
    if (!editor) return;
    const handler = ({ transaction }: { transaction: import('@tiptap/pm/state').Transaction }) => {
      const m = transaction.getMeta('modalRequest') as 'image' | 'video' | undefined;
      if (m === 'image') setImageOpen(true);
      if (m === 'video') setVideoOpen(true);
    };
    editor.on('transaction', handler);
    return () => {
      editor.off('transaction', handler);
    };
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="editor-canvas relative">
      <BubbleMenu editor={editor} />
      <EditorContent editor={editor} />
      <ImagePickerModal
        open={imageOpen}
        onClose={() => setImageOpen(false)}
        onSubmit={(src) => {
          editor.chain().focus().setImage({ src }).run();
        }}
      />
      <VideoInsertModal
        open={videoOpen}
        onClose={() => setVideoOpen(false)}
        onSubmit={(src) => {
          editor.commands.setYoutubeVideo({ src });
        }}
      />
    </div>
  );
}
