// tests/unit/editor/helpers/getEmbedSchema.ts
// Build a minimal ProseMirror Schema that derives the `embed` node spec from
// the actual `Embed` extension's config. Mirrors `getCalloutSchema.ts` so the
// unit tests exercise the real production spec — if `Embed.config` changes,
// the tests break.
import { Schema } from '@tiptap/pm/model';
import { callOrReturn } from '@tiptap/core';
import { Embed } from '@/components/editor/nodes/Embed';

export function getEmbedSchema(): Schema {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cfg = Embed.config as any;

  const attrs: Record<string, { default: unknown }> = {};
  const resolvedAttrs = cfg.addAttributes
    ? callOrReturn(cfg.addAttributes, Embed)
    : {};
  for (const [name, attr] of Object.entries(resolvedAttrs)) {
    attrs[name] = { default: (attr as { default?: unknown }).default };
  }

  const parseRules = cfg.parseHTML ? callOrReturn(cfg.parseHTML, Embed) : [];
  const parseDOM = parseRules.map((rule: { tag: string; getAttrs?: unknown }) => ({
    tag: rule.tag,
    getAttrs: rule.getAttrs as
      | ((node: HTMLElement | string) => Record<string, unknown> | false)
      | undefined,
  }));

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
        renderHTML.call(Embed, { node, HTMLAttributes: {} })
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
      embed: {
        group: cfg.group,
        // Embed is atom — empty content (Tiptap translates `atom: true` to
        // `content: 'inline*'` + `marks: ''` + `selectable: true` under the
        // hood, but we mirror the schema-level `content` here).
        content: 'inline*',
        atom: cfg.atom,
        attrs,
        parseDOM,
        toDOM,
      },
    },
  });
}
