import { describe, it, expect } from 'vitest';
import { SectionSchema, SectionsArraySchema } from '@/modules/pages/schema';

describe('SectionSchema', () => {
  it('parses a richtext section', () => {
    const result = SectionSchema.parse({
      kind: 'richtext',
      id: 's1',
      data: { json: { type: 'doc', content: [{ type: 'paragraph' }] } }
    });
    expect(result.kind).toBe('richtext');
  });

  it('parses a hero section', () => {
    const result = SectionSchema.parse({
      kind: 'hero',
      id: 's2',
      data: { title: 'Hi', subtitle: 'Sub' }
    });
    expect(result.kind).toBe('hero');
    if (result.kind === 'hero') {
      expect(result.data.title).toBe('Hi');
      expect(result.data.subtitle).toBe('Sub');
    }
  });

  it('parses a cta section', () => {
    const result = SectionSchema.parse({
      kind: 'cta',
      id: 's3',
      data: { title: 'CTA', primaryLabel: 'Go', primaryHref: '/x' }
    });
    expect(result.kind).toBe('cta');
  });

  it('parses a form section', () => {
    const result = SectionSchema.parse({
      kind: 'form',
      id: 's4',
      data: { formType: 'contact' }
    });
    expect(result.kind).toBe('form');
  });

  it('parses a media section', () => {
    const result = SectionSchema.parse({
      kind: 'media',
      id: 's5',
      data: { mediaId: 'm1', layout: 'full' }
    });
    expect(result.kind).toBe('media');
  });

  it('rawhtml — preserves <script> tags (admin escape hatch)', () => {
    const result = SectionSchema.parse({
      kind: 'rawhtml',
      id: 's6',
      data: { html: '<h1>Hi</h1><script>console.log("ok")</script>' }
    });
    expect(result.kind).toBe('rawhtml');
    if (result.kind === 'rawhtml') {
      expect(result.data.html).toContain('<h1>Hi</h1>');
      expect(result.data.html).toContain('<script>');
      expect(result.data.html).toContain('console.log');
    }
  });

  it('rawhtml — preserves inline <style> blocks', () => {
    const result = SectionSchema.parse({
      kind: 'rawhtml',
      id: 's_st',
      data: { html: '<style>.x { color: red }</style><div class="x">Hi</div>' }
    });
    if (result.kind === 'rawhtml') {
      expect(result.data.html).toContain('<style>');
      expect(result.data.html).toContain('.x { color: red }');
    }
  });

  it('rawhtml — preserves external <link rel="stylesheet">', () => {
    const result = SectionSchema.parse({
      kind: 'rawhtml',
      id: 's_lk',
      data: { html: '<link rel="stylesheet" href="https://cdn.example.com/x.css">' }
    });
    if (result.kind === 'rawhtml') {
      expect(result.data.html).toContain('<link');
      expect(result.data.html).toContain('rel="stylesheet"');
    }
  });

  it('rawhtml — strips inline event handlers (onclick)', () => {
    const result = SectionSchema.parse({
      kind: 'rawhtml',
      id: 's7',
      data: { html: '<a href="x" onclick="bad()">link</a>' }
    });
    if (result.kind === 'rawhtml') {
      expect(result.data.html).not.toMatch(/onclick=/i);
      expect(result.data.html).toMatch(/href="x"/);
    }
  });

  it('rawhtml — strips javascript: URLs', () => {
    const result = SectionSchema.parse({
      kind: 'rawhtml',
      id: 's_j',
      data: { html: '<a href="javascript:alert(1)">bad</a>' }
    });
    if (result.kind === 'rawhtml') {
      expect(result.data.html).not.toMatch(/href="javascript:/i);
    }
  });

  it('parses a divider section', () => {
    const result = SectionSchema.parse({
      kind: 'divider',
      id: 's8',
      data: {}
    });
    expect(result.kind).toBe('divider');
  });
});

describe('SectionsArraySchema', () => {
  it('rejects arrays over 50', () => {
    const arr = Array.from({ length: 51 }, (_, i) => ({
      kind: 'divider',
      id: `s${i}`,
      data: {}
    }));
    expect(() => SectionsArraySchema.parse(arr)).toThrow();
  });

  it('accepts mixed sections', () => {
    const arr = [
      { kind: 'hero', id: 'h1', data: { title: 'X' } },
      { kind: 'richtext', id: 'r1', data: { json: { type: 'doc' } } },
      { kind: 'divider', id: 'd1', data: {} }
    ];
    const result = SectionsArraySchema.parse(arr);
    expect(result).toHaveLength(3);
  });
});

describe('CategoriesSection', () => {
  it('parses a valid categories section with all fields', () => {
    const input = {
      kind: 'categories',
      id: 'sec1',
      data: {
        groupSlug: 'company',
        heading: 'Our categories',
        body: 'Browse by topic',
        layout: 'grid-3',
        limit: 12,
        showAll: false,
        orderBy: 'name'
      }
    };
    const parsed = SectionSchema.safeParse(input);
    expect(parsed.success).toBe(true);
  });

  it('applies default values for optional fields', () => {
    const input = {
      kind: 'categories',
      id: 'sec1',
      data: { groupSlug: 'default' }
    };
    const parsed = SectionSchema.safeParse(input);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      const s = parsed.data as Extract<typeof parsed.data, { kind: 'categories' }>;
      expect(s.data.layout).toBe('grid-3');
      expect(s.data.limit).toBe(12);
      expect(s.data.showAll).toBe(false);
      expect(s.data.orderBy).toBe('sortOrder');
    }
  });

  it('rejects missing groupSlug', () => {
    const input = {
      kind: 'categories',
      id: 'sec1',
      data: { layout: 'grid-2' }
    };
    const parsed = SectionSchema.safeParse(input);
    expect(parsed.success).toBe(false);
  });

  it('rejects invalid layout', () => {
    const input = {
      kind: 'categories',
      id: 'sec1',
      data: { groupSlug: 'default', layout: 'grid-5' }
    };
    const parsed = SectionSchema.safeParse(input);
    expect(parsed.success).toBe(false);
  });

  it('rejects invalid orderBy', () => {
    const input = {
      kind: 'categories',
      id: 'sec1',
      data: { groupSlug: 'default', orderBy: 'invalid' }
    };
    const parsed = SectionSchema.safeParse(input);
    expect(parsed.success).toBe(false);
  });

  it('rejects limit out of range', () => {
    const tooBig = {
      kind: 'categories',
      id: 'sec1',
      data: { groupSlug: 'default', limit: 49 }
    };
    expect(SectionSchema.safeParse(tooBig).success).toBe(false);

    const tooSmall = {
      kind: 'categories',
      id: 'sec1',
      data: { groupSlug: 'default', limit: 0 }
    };
    expect(SectionSchema.safeParse(tooSmall).success).toBe(false);
  });
});
