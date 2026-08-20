import { describe, it, expect } from 'vitest';
import { CreateGroupSchema, UpdateGroupSchema } from '@/modules/category-groups/server/schema';

describe('CreateGroupSchema', () => {
  it('requires a non-empty name', () => {
    expect(CreateGroupSchema.safeParse({ name: '' }).success).toBe(false);
  });
  it('caps name at 120 chars', () => {
    expect(CreateGroupSchema.safeParse({ name: 'x'.repeat(121) }).success).toBe(false);
  });
  it('accepts a normal name', () => {
    const r = CreateGroupSchema.safeParse({ name: 'Company' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.name).toBe('Company');
  });
});

describe('UpdateGroupSchema', () => {
  it('requires an id', () => {
    expect(UpdateGroupSchema.safeParse({ id: '' }).success).toBe(false);
  });
  it('accepts partial updates', () => {
    const r = UpdateGroupSchema.safeParse({ id: 'g1', sortOrder: 5 });
    expect(r.success).toBe(true);
  });
});
