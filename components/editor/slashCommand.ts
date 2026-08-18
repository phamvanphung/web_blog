// components/editor/slashCommand.ts
// Suggestion renderer factory.
//
// Tiptap v3's @tiptap/suggestion ships a managed `props.mount(element)` (built on
// @floating-ui/dom) that handles positioning, scroll/resize re-anchoring, and
// outside-click dismissal. We use it instead of managing our own popup div + CSS
// coordinates — earlier hand-rolled positioning left the menu parked at body
// origin and invisible behind the title input.

import { ReactRenderer } from '@tiptap/react';
import type { Editor, Range } from '@tiptap/core';
import type { SuggestionProps } from '@tiptap/suggestion';
import type { SlashItem } from './slashItems';
import { filterSlashItems, SLASH_ITEMS } from './slashItems';
import { getSlashCommands } from './slashCommands';
import SlashMenu from './SlashMenu';
import type { SlashMenuRef, SlashMenuRenderProps } from './SlashMenu';

export type { SlashMenuRenderProps };

/**
 * Default filter: fuzzy-matches SLASH_ITEMS against query, returns up to 8 results.
 */
export function defaultSlashFilter(query: string): SlashItem[] {
  return filterSlashItems(SLASH_ITEMS, query, 8);
}

/**
 * Build the command function handed to the Suggestion plugin.
 * Looks up `item.id` in the current slash-command map and runs it;
 * falls back to deleting the trigger range on error.
 */
export function buildSlashCommand(editor: Editor, range: Range) {
  return (item: SlashItem) => {
    const commands = getSlashCommands(editor, range);
    const fn = commands[item.id];
    if (fn) {
      fn();
    } else {
      // Unrecognised id — bail out cleanly.
      editor.chain().focus().deleteRange(range).run();
    }
  };
}

// Minimal lifecycle-handler prop type — SuggestionProps carries a lot we don't
// use (placement, offset, floatingUi config, …). We only need editor + items
// + command + mount; clientRect is kept optional for future debug hooks.
type LifecycleProps = Pick<
  SuggestionProps<SlashItem, { item: SlashItem }>,
  'editor' | 'items' | 'command' | 'mount' | 'clientRect'
>;

/**
 * Factory returning the Suggestion render hook object.
 * Creates a ReactRenderer for SlashMenu and hands the element to
 * `props.mount()` so Tiptap owns positioning + teardown.
 */
export function renderSlashMenu() {
  let renderer: ReactRenderer<SlashMenuRef, SlashMenuRenderProps> | undefined;
  let unmount: (() => void) | undefined;

  return {
    onStart(props: LifecycleProps) {
      renderer = new ReactRenderer(SlashMenu, {
        editor: props.editor,
        props: { items: props.items, command: props.command },
      });
      // props.mount appends to document.body (default container), anchors to
      // the cursor via Floating UI, and returns a teardown fn we must call in
      // onExit. No manual position math, no z-index dance.
      unmount = props.mount(renderer.element);
    },

    onUpdate(props: LifecycleProps) {
      renderer?.updateProps?.({ items: props.items, command: props.command });
    },

    onKeyDown({ event }: { event: KeyboardEvent }) {
      if (!renderer?.ref) return false;
      return renderer.ref.onKeyDown(event);
    },

    onExit() {
      unmount?.();
      renderer?.destroy();
      renderer = undefined;
      unmount = undefined;
    },
  };
}