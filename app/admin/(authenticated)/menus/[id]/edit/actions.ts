'use server';

// Server actions for the per-menu edit screen (`/admin/menus/[id]/edit`).
//
// - `updateMenuItemAction`: called by `<MenuItemRow>` inline edit form.
//   Mirrors the discriminated-union result shape used in
//   `app/admin/(authenticated)/categories/actions.ts` so the row can use
//   React 19 `useActionState` for the same error/success UX.
// - `reorderMenuItemsAction`: called from drag-and-drop on a flat item.
//   Validates the caller actually passes ids that belong to this menu,
//   then rewrites every `sortOrder` in a single `prisma.$transaction`
//   so the public menu reader never observes a half-applied reorder.

import { z } from 'zod';
import { revalidatePath, revalidateTag } from 'next/cache';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { audit, hashIp } from '@/lib/audit';
import { requireRole } from '@/lib/auth';
import { updateMenuItem } from '@/modules/menus/server';

export type MenuItemFormState = { ok: true } | { ok: false; error: string };

const UpdateSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).max(120),
  targetType: z.enum(['PAGE', 'POST', 'CATEGORY', 'EXTERNAL']),
  targetId: z.string().nullable().optional(),
  externalUrl: z
    .string()
    .url()
    .max(500)
    .nullable()
    .optional()
    .or(z.literal('').transform(() => null)),
  openInNew: z.boolean().optional(),
  isVisible: z.boolean().optional(),
  parentId: z.string().nullable().optional()
});

export async function updateMenuItemAction(
  _prev: MenuItemFormState | undefined,
  formData: FormData
): Promise<MenuItemFormState> {
  const me = await requireRole('ADMIN');

  // Parse target fields. Form posts the plain string representations; we
  // normalise empty strings to null so the Zod schema accepts the
  // "blank URL" case (clearing a previously-set externalUrl).
  const rawExternalUrl = formData.get('externalUrl');
  const rawTargetId = formData.get('targetId');
  const rawParentId = formData.get('parentId');

  const parsed = UpdateSchema.safeParse({
    id: String(formData.get('id') ?? ''),
    label: String(formData.get('label') ?? '').trim(),
    targetType: String(formData.get('targetType') ?? 'EXTERNAL'),
    targetId: typeof rawTargetId === 'string' && rawTargetId.trim() ? rawTargetId : null,
    externalUrl:
      typeof rawExternalUrl === 'string' && rawExternalUrl.trim()
        ? rawExternalUrl.trim()
        : null,
    // Booleans: form checkboxes only submit when checked, so absence = false.
    openInNew: formData.getAll('openInNew').at(-1) === 'on',
    isVisible: formData.getAll('isVisible').at(-1) === 'on',
    parentId: typeof rawParentId === 'string' && rawParentId.trim() ? rawParentId : null
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? 'Dữ liệu không hợp lệ.' };
  }

  // Cross-field validation: PAGE / POST / CATEGORY need a targetId, only
  // EXTERNAL accepts externalUrl. Mirrors the contract enforced by
  // `modules/menus/server/index.ts:ItemInput` (kept loose there on purpose
  // so this layer can return UI-friendly messages).
  if (
    parsed.data.targetType !== 'EXTERNAL' &&
    !parsed.data.targetId
  ) {
    return {
      ok: false,
      error: 'Loại target này yêu cầu nhập Target ID.'
    };
  }
  if (parsed.data.targetType === 'EXTERNAL' && !parsed.data.externalUrl) {
    return { ok: false, error: 'Loại EXTERNAL yêu cầu nhập URL.' };
  }

  await updateMenuItem(parsed.data.id, {
    label: parsed.data.label,
    targetType: parsed.data.targetType,
    targetId: parsed.data.targetId ?? null,
    externalUrl: parsed.data.externalUrl ?? null,
    openInNew: parsed.data.openInNew,
    isVisible: parsed.data.isVisible,
    parentId: parsed.data.parentId ?? null
  });

  const h = await headers();
  const ip =
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? h.get('x-real-ip') ?? null;
  await audit({
    userId: me.id,
    action: 'menu.item.update',
    target: 'MenuItem',
    targetId: parsed.data.id,
    ipHash: await hashIp(ip)
  });
  return { ok: true };
}

export async function reorderMenuItemsAction(formData: FormData): Promise<void> {
  const me = await requireRole('ADMIN');

  const menuId = String(formData.get('menuId') ?? '').trim();
  const orderedIdsRaw = String(formData.get('orderedIds') ?? '').trim();
  const orderedIds = orderedIdsRaw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (!menuId || orderedIds.length === 0) return;

  // Defence in depth — make sure every id we're about to rewrite actually
  // belongs to the menu the caller named. This blocks an attacker from
  // rewriting sortOrder on items of a different menu by submitting a
  // hand-crafted FormData. We keep only the ids that match.
  const existing = await db.menuItem.findMany({
    where: { id: { in: orderedIds }, menuId },
    select: { id: true }
  });
  const valid = new Set(existing.map((r) => r.id));
  const safeOrdered = orderedIds.filter((id) => valid.has(id));
  if (safeOrdered.length === 0) return;

  // Atomic rewrite — wrapped in $transaction so the public reader never
  // sees a half-applied reorder (would render some items at old positions,
  // some at new).
  await db.$transaction(
    safeOrdered.map((id, index) =>
      db.menuItem.update({ where: { id }, data: { sortOrder: index } })
    )
  );

  const h = await headers();
  const ip =
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? h.get('x-real-ip') ?? null;
  await audit({
    userId: me.id,
    action: 'menu.item.reorder',
    target: 'Menu',
    targetId: menuId,
    metadata: { count: safeOrdered.length },
    ipHash: await hashIp(ip)
  });

  revalidatePath(`/admin/menus/${menuId}/edit`);

  // Invalidate the public menu cache tag. We can't import the private
  // `revalidateMenu` helper from modules/menus/server, so we re-derive its
  // behaviour here: invalidate the location's tag, or both default slots
  // when the menu has no location yet.
  const menu = await db.menu.findUnique({
    where: { id: menuId },
    select: { location: true }
  });
  if (menu?.location) {
    revalidateTag(`menu:${menu.location}`);
  } else {
    revalidateTag('menu:primary');
    revalidateTag('menu:footer');
  }
}
