import { describe, expect, it, vi } from 'vitest';
import { callOrReturn, createNodeFromContent } from '@tiptap/core';
import type { Node as PMNode } from '@tiptap/pm/model';
import { Callout } from '@/components/editor/nodes/Callout';
import { getCalloutSchema } from './helpers/getCalloutSchema';

describe('Callout extension (spec + command)', () => {
  it('is a block node with block+ content', () => {
    const schema = getCalloutSchema();
    const node = schema.nodes.callout;
    expect(node).toBeDefined();
    expect(node!.spec.group).toBe('block');
    expect(node!.spec.content).toBe('block+');
  });

  it('defaults tone to "info"', () => {
    const schema = getCalloutSchema();
    const node = schema.nodes.callout!.create();
    expect(node.attrs.tone).toBe('info');
  });

  it('accepts "warn" tone', () => {
    const schema = getCalloutSchema();
    const node = schema.nodes.callout!.create({ tone: 'warn' });
    expect(node.attrs.tone).toBe('warn');
  });

  it('round-trips an unknown tone value as-is (no runtime validation)', () => {
    // Lock in the current behaviour: Tiptap's `addAttributes` doesn't validate
    // attr values, so any string is accepted and preserved. If we ever add
    // validation, this test will catch the change.
    const schema = getCalloutSchema();
    const node = schema.nodes.callout!.create({ tone: 'banana' });
    expect(node.attrs.tone).toBe('banana');
    const reparsed = schema.nodeFromJSON(node.toJSON());
    expect(reparsed.attrs.tone).toBe('banana');
  });

  it('exports Callout as a Tiptap Node.create result with name "callout"', () => {
    // Tiptap's `Node.create` returns an Extension instance whose `.name`
    // getter reflects the configured node name. The schema also exposes
    // the resolved name via `schema.nodes.callout.name`.
    expect(Callout.name).toBe('callout');
    expect(getCalloutSchema().nodes.callout!.name).toBe('callout');
  });

  describe('Callout.parseHTML / Callout.renderHTML', () => {
    it('parseHTML advertises the [aside[data-callout]] rule', () => {
      // Tiptap's parseHTML can be a function or a value; resolve via
      // callOrReturn so we exercise the same path Tiptap itself uses.
      const rules = callOrReturn(
        Callout.config.parseHTML,
        Callout,
      ) as Array<{ tag: string }>;
      expect(rules).toBeDefined();
      expect(rules).toHaveLength(1);
      expect(rules[0]!.tag).toBe('aside[data-callout]');
    });

    it('renderHTML produces [aside, <attrs>, content] with rendered tone', () => {
      // Tiptap processes the `tone` attribute through its own
      // addAttributes.renderHTML() before calling Callout's renderHTML, so
      // the second-arg `HTMLAttributes` already has `data-tone` populated.
      // Mirror that pipeline here so we exercise the real renderHTML.
      // The `as any` casts below are scoped to the test-only stub; the
      // production code path uses Tiptap's own getExtensionField, which
      // handles the `this` binding.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const attrs = callOrReturn(Callout.config.addAttributes, Callout) as any;
      const node: PMNode = { attrs: { tone: 'warn' } } as unknown as PMNode;
      const htmlAttrs: Record<string, unknown> =
        attrs.tone.renderHTML?.(node.attrs) ?? {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const out = (Callout.config.renderHTML as any).call(Callout, {
        node,
        HTMLAttributes: htmlAttrs,
      });
      expect(Array.isArray(out)).toBe(true);
      const [tag, outAttrs] = out as [string, Record<string, string>];
      expect(tag).toBe('aside');
      expect(outAttrs['data-callout']).toBe('');
      expect(outAttrs['data-tone']).toBe('warn');
      expect(outAttrs.class).toBe('callout');
    });

    it('serialises and deserialises a warn callout round-trip', () => {
      const schema = getCalloutSchema();
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
  });

  describe('setCallout command', () => {
    // The slash menu collapses the current selection to an empty range before
    // invoking `setCallout`. The previous `wrapIn`-based implementation
    // silently failed (wrapIn requires a non-empty range). setCallout now
    // uses `insertContent`, which works on an empty selection — and we
    // exercise that path by capturing the JSONContent the command hands to
    // `insertContent` and feeding it back through `createNodeFromContent`
    // against a real ProseMirror schema.

    // Resolve the setCallout command from the production addCommands() map.
    // The casts are necessary because `AddCommands` types are tied to a
    // full Tiptap Editor context (editor, tr, can, chain, ...), which we
    // don't have here — we just want the JSONContent it forwards to
    // `insertContent`.
    type SetCallout = (
      attrs?: { tone?: 'info' | 'warn' },
    ) => (props: {
      commands: { insertContent: ReturnType<typeof vi.fn> };
    }) => boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const setCallout = (Callout.config.addCommands as any).call(Callout, {})
      .setCallout as SetCallout;

    it('inserts a callout with the requested tone and a paragraph child', () => {
      const schema = getCalloutSchema();
      const insertContent = vi.fn().mockReturnValue(true);

      const ok = setCallout({ tone: 'warn' })({
        commands: { insertContent } as never,
      });
      expect(ok).toBe(true);
      expect(insertContent).toHaveBeenCalledTimes(1);

      const arg = insertContent.mock.calls[0]![0] as Parameters<typeof createNodeFromContent>[0];
      // createNodeFromContent returns a single Node (we pass an object, not
      // an array). Cast to Node so we can read .type, .attrs, .firstChild.
      const callout = createNodeFromContent(arg, schema) as PMNode;
      expect(callout.type.name).toBe('callout');
      expect(callout.attrs.tone).toBe('warn');
      expect(callout.childCount).toBeGreaterThanOrEqual(1);
      expect(callout.firstChild!.type.name).toBe('paragraph');
    });

    it('falls back to the default tone ("info") when called with no attrs', () => {
      const schema = getCalloutSchema();
      const insertContent = vi.fn().mockReturnValue(true);

      const ok = setCallout()({ commands: { insertContent } as never });
      expect(ok).toBe(true);

      const arg = insertContent.mock.calls[0]![0] as Parameters<typeof createNodeFromContent>[0];
      const callout = createNodeFromContent(arg, schema) as PMNode;
      expect(callout.attrs.tone).toBe('info');
    });
  });
});
