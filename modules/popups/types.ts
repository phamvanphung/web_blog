// modules/popups/types.ts
// Domain types for the popup module.

import type { Popup } from '@prisma/client';

/** Subset of Popup passed from server layout to the client PopupLayer.
 *  Includes `status` and `deletedAt` so the matcher's defense-in-depth
 *  check (`matches()` re-verifies these fields on the cached row) has
 *  the data it needs at runtime. If PUBLIC_SELECT in `server/public.ts`
 *  narrows the SELECT, both must change together. */
export type SerializedPopup = Pick<
  Popup,
  | 'id'
  | 'name'
  | 'htmlContent'
  | 'status'
  | 'triggerType'
  | 'triggerPaths'
  | 'frequency'
  | 'delaySeconds'
  | 'deletedAt'
>;

export type CreatePopupInput = {
  name: string;
  htmlContent: string;
  triggerType: Popup['triggerType'];
  triggerPaths: string[] | null;
  frequency: Popup['frequency'];
  delaySeconds: number;
  status: Popup['status'];
  notes: string | null;
};

export type UpdatePopupInput = Partial<CreatePopupInput>;
