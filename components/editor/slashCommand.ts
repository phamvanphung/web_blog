// components/editor/slashCommand.ts
// Suggestion renderer factory — mounts a ReactRenderer portal into document.body.

import { ReactRenderer } from '@tiptap/react';
import type { Editor, Range } from '@tiptap/core';
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

function positionPopup(popup: HTMLElement, rect: DOMRect | null) {
  if (!popup || !rect) return;
  popup.style.top = `${window.scrollY + rect.bottom + 4}px`;
  popup.style.left = `${window.scrollX + rect.left}px`;
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

/**
 * Factory returning the Suggestion render hook object.
 * Creates a ReactRenderer portal for SlashMenu and wires all four lifecycle
 * callbacks (`onStart`, `onUpdate`, `onKeyDown`, `onExit`).
 */
export function renderSlashMenu() {
  let renderer: ReactRenderer<SlashMenuRef, SlashMenuRenderProps> | undefined;
  let popup: HTMLDivElement | undefined;

  function ensurePopup() {
    if (popup) return;
    popup = document.createElement('div');
    popup.style.position = 'absolute';
    popup.style.zIndex = '50';
    document.body.appendChild(popup);
  }

  return {
    onStart(props: SlashMenuRenderProps) {
      ensurePopup();
      renderer = new ReactRenderer(SlashMenu, {
        editor: props as unknown as Editor,
        props,
      });
      // ReactRenderer appends its element to document.body during construction.
      // Move it into our positioned popup so we control z-index and visibility.
      popup!.appendChild(renderer.element);
    },

    onUpdate(props: SlashMenuRenderProps) {
      if (!renderer) return;
      // Reposition popup to stay anchored to the cursor.
      const rect = props.clientRect?.() ?? null;
      positionPopup(popup!, rect);
      // Svelte/Tiptap pattern: updateProps re-renders without full destroy.
      renderer.updateProps?.(props);
    },

    onKeyDown({ event }: { event: KeyboardEvent }) {
      if (!renderer?.ref) return false;
      return renderer.ref.onKeyDown(event);
    },

    onExit() {
      if (!renderer) return;
      renderer.destroy();
      renderer = undefined;
      popup?.remove();
      popup = undefined;
    },
  };
}
