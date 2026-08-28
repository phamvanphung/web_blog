// tests/unit/popup-schema.test.ts
// Zod validation rules for popup create/update.

import { describe, it, expect } from 'vitest';
import { PopupCreateSchema, PopupUpdateSchema } from '@/modules/popups/schema';

describe('PopupCreateSchema', () => {
  const base = {
    name: 'Promo',
    htmlContent: '<p>hi</p>',
    triggerType: 'ALL' as const,
    triggerPaths: null,
    frequency: 'ONCE' as const,
    delaySeconds: 0,
    status: 'DRAFT' as const,
    notes: null
  };

  it('accepts a valid minimal popup', () => {
    expect(PopupCreateSchema.safeParse(base).success).toBe(true);
  });

  it('rejects empty name', () => {
    expect(PopupCreateSchema.safeParse({ ...base, name: '' }).success).toBe(false);
  });

  it('rejects name > 120 chars', () => {
    expect(PopupCreateSchema.safeParse({ ...base, name: 'a'.repeat(121) }).success).toBe(false);
  });

  it('rejects empty htmlContent', () => {
    expect(PopupCreateSchema.safeParse({ ...base, htmlContent: '' }).success).toBe(false);
  });

  it('rejects htmlContent > 500 KB', () => {
    const huge = '<p>' + 'a'.repeat(500 * 1024) + '</p>';
    expect(PopupCreateSchema.safeParse({ ...base, htmlContent: huge }).success).toBe(false);
  });

  it('requires triggerPaths when triggerType is PATH', () => {
    const out = PopupCreateSchema.safeParse({ ...base, triggerType: 'PATH', triggerPaths: null });
    expect(out.success).toBe(false);
  });

  it('requires non-empty triggerPaths when triggerType is PATH', () => {
    const out = PopupCreateSchema.safeParse({
      ...base,
      triggerType: 'PATH',
      triggerPaths: []
    });
    expect(out.success).toBe(false);
  });

  it('rejects triggerPaths entries that do not start with /', () => {
    const out = PopupCreateSchema.safeParse({
      ...base,
      triggerType: 'PATH',
      triggerPaths: ['about', '/contact']
    });
    expect(out.success).toBe(false);
  });

  it('rejects triggerPaths entries containing :// (absolute URLs)', () => {
    const out = PopupCreateSchema.safeParse({
      ...base,
      triggerType: 'PATH',
      triggerPaths: ['https://evil.example.com/x']
    });
    expect(out.success).toBe(false);
  });

  it('accepts triggerPaths entries starting with /', () => {
    const out = PopupCreateSchema.safeParse({
      ...base,
      triggerType: 'PATH',
      triggerPaths: ['/about', '/contact']
    });
    expect(out.success).toBe(true);
  });

  it('rejects delaySeconds < 0', () => {
    expect(PopupCreateSchema.safeParse({ ...base, delaySeconds: -1 }).success).toBe(false);
  });

  it('rejects delaySeconds > 300', () => {
    expect(PopupCreateSchema.safeParse({ ...base, delaySeconds: 301 }).success).toBe(false);
  });

  it('rejects notes > 500 chars', () => {
    expect(PopupCreateSchema.safeParse({ ...base, notes: 'a'.repeat(501) }).success).toBe(false);
  });

  it('accepts null notes', () => {
    expect(PopupCreateSchema.safeParse({ ...base, notes: null }).success).toBe(true);
  });
});

describe('PopupUpdateSchema', () => {
  it('requires id', () => {
    expect(PopupUpdateSchema.safeParse({ name: 'x' }).success).toBe(false);
  });

  it('accepts a partial update with id only', () => {
    expect(PopupUpdateSchema.safeParse({ id: 'p1' }).success).toBe(true);
  });

  it('honours same field constraints as CreateSchema', () => {
    expect(PopupUpdateSchema.safeParse({ id: 'p1', name: '' }).success).toBe(false);
    expect(
      PopupUpdateSchema.safeParse({ id: 'p1', triggerType: 'PATH', triggerPaths: null }).success
    ).toBe(false);
  });
});
