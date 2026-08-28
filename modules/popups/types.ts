// modules/popups/types.ts
// Domain types for the popup module.

import type { Popup } from '@prisma/client';

/** Subset of Popup passed from server layout to the client PopupLayer. */
export type SerializedPopup = Pick<
  Popup,
  | 'id'
  | 'name'
  | 'htmlContent'
  | 'triggerType'
  | 'triggerPaths'
  | 'frequency'
  | 'delaySeconds'
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
