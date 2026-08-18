import { describe, expect, it } from 'vitest';
import { getSchema, Callout } from '@/components/editor/nodes/Callout';

describe('Callout node schema', () => {
  it('is a block node containing block+ content', () => {
    const schema = getSchema();
    const node = schema.nodes.callout;
    expect(node).toBeDefined();
    expect(node!.spec.group).toBe('block');
    expect(node!.spec.content).toBe('block+');
  });

  it('defaults tone to "info"', () => {
    const schema = getSchema();
    const node = schema.nodes.callout!.create();
    expect(node.attrs.tone).toBe('info');
  });

  it('accepts "warn" tone', () => {
    const schema = getSchema();
    const node = schema.nodes.callout!.create({ tone: 'warn' });
    expect(node.attrs.tone).toBe('warn');
  });

  it('serialises and deserialises round-trip', () => {
    const schema = getSchema();
    const original = schema.nodes.callout!.create(
      { tone: 'warn' },
      schema.nodes.paragraph!.create(
        null,
        schema.text('Storm warning: heavy rain expected.'),
      ),
    );
    const json = original.toJSON();
    const parsed = schema.nodeFromJSON(json);
    expect(parsed.attrs.tone).toBe('warn');
    expect(parsed.textContent).toBe('Storm warning: heavy rain expected.');
  });

  it('exports Callout as a Tiptap Node.create result with name "callout"', () => {
    // Tiptap's `Node.create` returns an Extension instance whose `.name`
    // getter reflects the configured node name. The schema also exposes
    // the resolved name via `schema.nodes.callout.name`.
    expect(Callout.name).toBe('callout');
    expect(getSchema().nodes.callout!.name).toBe('callout');
  });
});
