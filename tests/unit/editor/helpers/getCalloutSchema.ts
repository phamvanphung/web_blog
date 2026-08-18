// tests/unit/editor/helpers/getCalloutSchema.ts
// Build a minimal ProseMirror Schema that derives the `callout` node spec from
// the actual `Callout` extension's config (not a hand-rolled duplicate). This
// way the unit tests exercise the real production spec — if `Callout.config`
// changes, the tests break.
//
// We avoid `@tiptap/core`'s `getSchema(extensions)` here because it would
// require us to also define `doc` / `paragraph` / `text` as Tiptap extensions
// (each going through the getExtensionField machinery). For a single-node
// regression test, hand-defining the outer nodes and reading Callout's config
// for the `callout` node is simpler and avoids dragging any extra Tiptap
// internals into the test path.
import { Schema } from '@tiptap/pm/model';
import { callOrReturn } from '@tiptap/core';
import { Callout } from '@/components/editor/nodes/Callout';

export function getCalloutSchema(): Schema {
  // `Callout.config` fields like `parseHTML()`, `renderHTML()`, `addAttributes()`
  // are typed as methods that need the Tiptap `this` context (extension +
  // options + storage + editor). For a test-only schema builder we don't have
  // a fully resolved extension, so we read them through `any` and pass
  // `Callout` as the `this` argument via `callOrReturn`. The runtime values
  // come straight from the production code.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cfg = Callout.config as any;

  // Mirror Tiptap's addAttributes into ProseMirror's `attrs` map (default
  // values only; the attribute parsers/serializers are handled by the
  // source-of-truth `Callout.config.renderHTML` / `parseHTML` below).
  const attrs: Record<string, { default: unknown }> = {};
  const resolvedAttrs = cfg.addAttributes
    ? callOrReturn(cfg.addAttributes, Callout)
    : {};
  for (const [name, attr] of Object.entries(resolvedAttrs)) {
    attrs[name] = { default: (attr as { default?: unknown }).default };
  }

  // Translate Tiptap parse rules into ProseMirror parseDOM. `getAttrs` on
  // the Tiptap side is the same shape Tiptap forwards to PM, so we pass
  // it through directly.
  const parseRules = cfg.parseHTML ? callOrReturn(cfg.parseHTML, Callout) : [];
  const parseDOM = parseRules.map((rule: { tag: string; getAttrs?: unknown }) => ({
    tag: rule.tag,
    getAttrs: rule.getAttrs as
      | ((node: HTMLElement | string) => Record<string, unknown> | false)
      | undefined,
  }));

  // Tiptap's renderHTML already returns a ProseMirror DOMOutputSpec — wrap
  // it so the PM Schema sees a `(node) => DOMOutputSpec` signature.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderHTML = cfg.renderHTML as
    | ((
        this: unknown,
        props: {
          node: import('@tiptap/pm/model').Node;
          HTMLAttributes: Record<string, unknown>;
        },
      ) => import('@tiptap/pm/model').DOMOutputSpec)
    | undefined;
  const toDOM = renderHTML
    ? (node: import('@tiptap/pm/model').Node) =>
        renderHTML.call(Callout, { node, HTMLAttributes: {} })
    : undefined;

  return new Schema({
    nodes: {
      doc: { content: 'block+' },
      paragraph: {
        group: 'block',
        content: 'inline*',
        parseDOM: [{ tag: 'p' }],
        toDOM: () => ['p', 0],
      },
      text: { group: 'inline' },
      callout: {
        group: cfg.group,
        content: cfg.content,
        defining: cfg.defining,
        attrs,
        parseDOM,
        toDOM,
      },
    },
  });
}
