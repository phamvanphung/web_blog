'use client';

import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import type { SlashItem } from './slashItems';

export type SlashMenuRef = {
  onKeyDown: (event: KeyboardEvent) => boolean;
};

export type SlashMenuRenderProps = {
  items: SlashItem[];
  command: (props: { item: SlashItem }) => void;
  clientRect?: (() => DOMRect | null) | null;
};

const GROUP_LABELS: Record<SlashItem['group'], string> = {
  Text: 'Văn bản',
  Media: 'Media',
  Layout: 'Bố cục',
  Advanced: 'Nâng cao',
};

const SlashMenu = forwardRef<SlashMenuRef, SlashMenuRenderProps>(
  ({ items, command }, ref) => {
    const [active, setActive] = useState(0);

    // Reset selection to first item whenever the item list changes.
    useEffect(() => {
      setActive(0);
    }, [items]);

    useImperativeHandle(ref, () => ({
      onKeyDown(event: KeyboardEvent) {
        if (!items.length) return false;
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          setActive((a) => (a + 1) % items.length);
          return true;
        }
        if (event.key === 'ArrowUp') {
          event.preventDefault();
          setActive((a) => (a - 1 + items.length) % items.length);
          return true;
        }
        if (event.key === 'Enter') {
          event.preventDefault();
          const item = items[active];
          if (item) command({ item });
          return true;
        }
        return false;
      },
    }));

    const groups: SlashItem['group'][] = ['Text', 'Media', 'Layout', 'Advanced'];

    let cursor = 0;
    return (
      <div className="slash-menu w-[280px] rounded-11 border border-hairline bg-canvas shadow-lg">
        {groups.map((group) => {
          const groupItems = items.filter((it) => it.group === group);
          if (!groupItems.length) return null;
          return (
            <div key={group}>
              <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-ink-50">
                {GROUP_LABELS[group]}
              </div>
              {groupItems.map((item) => {
                const myIdx = cursor;
                cursor++;
                const isActive = myIdx === active;
                return (
                  <button
                    key={item.id}
                    onMouseEnter={() => setActive(myIdx)}
                    onClick={() => command({ item })}
                    className={`flex w-full items-center gap-3 px-3 py-2 text-sm transition-colors ${
                      isActive
                        ? 'bg-canvas-parchment text-ink'
                        : 'text-ink-80 hover:bg-canvas-parchment/60'
                    }`}
                  >
                    <span className="text-base">{item.label}</span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  }
);

SlashMenu.displayName = 'SlashMenu';

export default SlashMenu;
