// components/editor/extensions.ts
// Tiptap extension bundle. Server-side use of @tiptap/html imports these too.

import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';
import { TableKit } from '@tiptap/extension-table';
import Placeholder from '@tiptap/extension-placeholder';
import { generateHTML } from '@tiptap/html';

export const extensionBundle = [
  StarterKit.configure({ codeBlock: { HTMLAttributes: { class: 'language-plain' } } }),
  Link.configure({ openOnClick: false, autolink: true, linkOnPaste: true }),
  Image.configure({ inline: false, allowBase64: false }),
  Youtube.configure({ controls: true, nocookie: true, modestBranding: true }),
  TableKit.configure({ table: { resizable: true } }),
  Placeholder.configure({ placeholder: 'Bắt đầu viết...' })
];

export { generateHTML };
