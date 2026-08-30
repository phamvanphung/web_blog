// app/admin/(authenticated)/menus/TargetField.tsx
//
// Conditional input bound to a menu item's `target`. Used by both the
// add form (MenuEditor) and the inline edit form (MenuItemRow) so the
// field shape — and therefore validation + server-action mapping —
// stays identical across create/update.
//
// UX:
//   • targetType === 'EXTERNAL' → URL text input. Posts `externalUrl`.
//   • targetType === 'PAGE'/'POST'/'CATEGORY' → button that opens
//     `<PickTargetDialog>`, a paginated server-backed search picker.
//     Posts `targetId`.
//
// Edit-form fallback: if the row already has a `targetId` whose label
// we can't resolve server-side (rare — e.g. the linked entry has been
// deleted), the trigger button shows a short id, and the dialog's
// search results page will surface it as a clickable row.

'use client';

import { useState } from 'react';
import { PickTargetDialog } from './PickTargetDialog';

export type TargetType = 'EXTERNAL' | 'PAGE' | 'POST' | 'CATEGORY';

const inputClass =
  'h-11 w-full rounded-11 bg-canvas-parchment px-4 text-[15px] text-ink border border-transparent outline-none focus:border-primary-focus focus:bg-canvas';
const labelClass = 'mb-1 block text-[13px] text-ink-80';

type Props = {
  type: TargetType;
  /** Edit-form only — pre-fill for the URL when type is EXTERNAL. */
  currentExternalUrl?: string | null;
  /** Edit-form only — pre-fill for the target id when type is non-EXTERNAL. */
  currentTargetId?: string | null;
  /** Pre-resolved label for `currentTargetId` (server-fetched in
      page.tsx so the trigger button shows the friendly name without a
      round-trip on first render). */
  currentTargetLabel?: string | null;
  /** Fired when the dialog picks a new target. The parent should hold
      the picked `(id, label)` in state so the trigger button reflects
      the new selection and the hidden input submits the right value. */
  onPick?: (id: string, label: string) => void;
};

export function TargetField({
  type,
  currentExternalUrl,
  currentTargetId,
  currentTargetLabel,
  onPick
}: Props) {
  if (type === 'EXTERNAL') {
    return (
      <div>
        <label className={labelClass}>External URL</label>
        <input
          name="externalUrl"
          type="url"
          placeholder="https://…"
          defaultValue={currentExternalUrl ?? ''}
          className={inputClass}
        />
      </div>
    );
  }

  return (
    <div>
      <label className={labelClass}>
        Chọn {type === 'PAGE' ? 'trang' : type === 'POST' ? 'bài viết' : 'chủ đề'}
      </label>
      <TargetDialogWithState
        type={type}
        initialValue={currentTargetId ?? null}
        initialLabel={currentTargetLabel ?? null}
        onPick={onPick}
      />
      {/* Server expects both fields in the form payload; sending the
          not-active branch as empty keeps the action's null-normalisation
          and Zod schema in lockstep regardless of which branch is
          currently mounted. The dialog owns `targetId` via its hidden
          input; here we keep `externalUrl` empty. */}
      <input type="hidden" name="externalUrl" value="" />
    </div>
  );
}

/**
 * Local holder for the picked `(id, label)` pair. Lives inside the
 * non-EXTERNAL branch because that's the only branch that needs the
 * controlled hidden input. EXTERNAL stays uncontrolled (just a text
 * input) since there is no choice beyond typing the URL.
 */
function TargetDialogWithState({
  type,
  initialValue,
  initialLabel,
  onPick
}: {
  type: Exclude<TargetType, 'EXTERNAL'>;
  initialValue: string | null;
  initialLabel: string | null;
  onPick?: (id: string, label: string) => void;
}) {
  const [pickedId, setPickedId] = useState<string | null>(initialValue);
  const [pickedLabel, setPickedLabel] = useState<string | null>(initialLabel);

  return (
    <>
      <input type="hidden" name="targetId" value={pickedId ?? ''} />
      <PickTargetDialog
        type={type}
        value={pickedId}
        currentLabel={pickedLabel}
        onPick={(id, label) => {
          setPickedId(id);
          setPickedLabel(label);
          onPick?.(id, label);
        }}
      />
    </>
  );
}
