// Re-exports the community drag handle so consumers import from a stable path.
// Update happens in extensions.ts (configure({ dragHandleWidth: 24 })).
import GlobalDragHandle from 'tiptap-extension-global-drag-handle';
export { GlobalDragHandle as DragHandle };
