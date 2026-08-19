import { describe, expect, it, vi } from 'vitest';
import { callOrReturn, createNodeFromContent } from '@tiptap/core';
import type { Node as PMNode } from '@tiptap/pm/model';
import { Embed } from '@/components/editor/nodes/Embed';
import { getEmbedSchema } from './helpers/getEmbedSchema';

describe('Embed extension (spec + command)', () => {
  it('is an atom block node', () => {
    const schema = getEmbedSchema();
    const node = schema.nodes.embed;
    expect(node).toBeDefined();
    expect(node!.spec.group).toBe('block');
    expect(node!.spec.atom).toBe(true);
  });

  it('exports Embed as a Tiptap Node.create result with name "embed"', () => {
    expect(Embed.name).toBe('embed');
    expect(getEmbedSchema().nodes.embed!.name).toBe('embed');
  });

  it('defaults src to null', () => {
    const schema = getEmbedSchema();
    const node = schema.nodes.embed!.create();
    expect(node.attrs.src).toBeNull();
  });

  it('stores a provided src', () => {
    const schema = getEmbedSchema();
    const node = schema.nodes.embed!.create({
      src: 'https://www.google.com',
    });
    expect(node.attrs.src).toBe('https://www.google.com');
  });

  describe('Embed.parseHTML / Embed.renderHTML', () => {
    it('parseHTML advertises the [iframe[src]] rule', () => {
      const rules = callOrReturn(Embed.config.parseHTML, Embed) as Array<{
        tag: string;
      }>;
      expect(rules).toBeDefined();
      expect(rules).toHaveLength(1);
      expect(rules[0]!.tag).toBe('iframe[src]');
    });

    it('renderHTML produces [iframe, <attrs>] with src + allowfullscreen', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const attrs = callOrReturn(Embed.config.addAttributes, Embed) as any;
      const node: PMNode = {
        attrs: { src: 'https://www.google.com' },
      } as unknown as PMNode;
      const htmlAttrs: Record<string, unknown> =
        attrs.src.renderHTML?.(node.attrs) ?? {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const out = (Embed.config.renderHTML as any).call(Embed, {
        node,
        HTMLAttributes: htmlAttrs,
      });
      expect(Array.isArray(out)).toBe(true);
      const [tag, outAttrs] = out as [string, Record<string, string>];
      expect(tag).toBe('iframe');
      expect(outAttrs['src']).toBe('https://www.google.com');
      // allowfullscreen + frameborder + loading are added by renderHTML itself
      // regardless of the input attr map.
      expect(outAttrs['allowfullscreen']).toBe('');
      expect(outAttrs['loading']).toBe('lazy');
      expect(outAttrs['frameborder']).toBe('0');
    });

    it('omits src attribute when src is null/empty (no malformed <iframe src="">)', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const attrs = callOrReturn(Embed.config.addAttributes, Embed) as any;
      const node: PMNode = { attrs: { src: null } } as unknown as PMNode;
      const htmlAttrs: Record<string, unknown> =
        attrs.src.renderHTML?.(node.attrs) ?? {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const out = (Embed.config.renderHTML as any).call(Embed, {
        node,
        HTMLAttributes: htmlAttrs,
      });
      const [, outAttrs] = out as [string, Record<string, string>];
      // When src is falsy, renderHTML returns {} → no src key on the iframe.
      expect('src' in outAttrs).toBe(false);
    });

    it('serialises and deserialises round-trip', () => {
      const schema = getEmbedSchema();
      const original = schema.nodes.embed!.create({
        src: 'https://example.com/embed',
      });
      const json = original.toJSON();
      const parsed = schema.nodeFromJSON(json);
      expect(parsed.attrs.src).toBe('https://example.com/embed');
    });
  });

  describe('setEmbed command', () => {
    // Resolve the setEmbed command from the production addCommands() map.
    // The casts are necessary because `AddCommands` types are tied to a full
    // Tiptap Editor context — we only want the JSONContent it forwards to
    // `insertContent`.
    type SetEmbed = (attrs: {
      src: string;
    }) => (props: {
      commands: { insertContent: ReturnType<typeof vi.fn> };
    }) => boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const setEmbed = (Embed.config.addCommands as any).call(Embed, {})
      .setEmbed as SetEmbed;

    it('inserts an embed node with the provided src', () => {
      const schema = getEmbedSchema();
      const insertContent = vi.fn().mockReturnValue(true);

      const ok = setEmbed({ src: 'https://www.google.com' })({
        commands: { insertContent } as never,
      });
      expect(ok).toBe(true);
      expect(insertContent).toHaveBeenCalledTimes(1);

      const arg = insertContent.mock.calls[0]![0] as Parameters<
        typeof createNodeFromContent
      >[0];
      const embed = createNodeFromContent(arg, schema) as PMNode;
      expect(embed.type.name).toBe('embed');
      expect(embed.attrs.src).toBe('https://www.google.com');
    });

    it('does NOT round-trip through HTML — embeds use JSONContent only', () => {
      // This is the regression gate for the original bug: the previous
      // implementation passed `<iframe src="...">` as a *string* to
      // `insertContent`, which Tiptap parsed as text (escaped HTML literal
      // in the paragraph). The new path uses insertContent with a JSON spec,
      // so `createNodeFromContent` resolves the node via the schema, not
      // via the HTML parser.
      const schema = getEmbedSchema();
      const insertContent = vi.fn().mockReturnValue(true);

      setEmbed({ src: 'https://example.com/x' })({
        commands: { insertContent } as never,
      });

      const arg = insertContent.mock.calls[0]![0];
      // arg must be an object (JSONContent), NOT a string.
      expect(typeof arg).toBe('object');
      expect(typeof arg).not.toBe('string');
    });
  });
});
