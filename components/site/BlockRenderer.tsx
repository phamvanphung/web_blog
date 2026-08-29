import type { Section } from '@/modules/pages/types';
import { sectionToHtml } from '@/modules/pages/server/render';
import { HeroBlock } from './blocks/HeroBlock';
import { CtaBlock } from './blocks/CtaBlock';
import { RichTextBlock } from './blocks/RichTextBlock';
import { MediaBlock } from './blocks/MediaBlock';
import { RawHtmlBlock } from './blocks/RawHtmlBlock';
import { DividerBlock } from './blocks/DividerBlock';
import { FormBlock } from './blocks/FormBlock';
import { CategoryBlock } from './blocks/CategoryBlock';
import { PostsBlock } from './blocks/PostsBlock';

export function BlockRenderer({ sections }: { sections: Section[] }) {
  return (
    <>
      {sections.map((s) => {
        switch (s.kind) {
          case 'hero': {
            // `key` must be on the outermost element returned from the
            // map callback. We used to put it on <HeroBlock> (an inner
            // element) which silently passed the React key warning —
            // Fragment children still need keys on the actual node that
            // appears in the array.
            return (
              <div key={s.id} className="diag-full-bleed">
                <HeroBlock {...s.data} />
              </div>
            );
          }
          case 'cta': {
            return (
              <div key={s.id} className="diag-full-bleed">
                <CtaBlock {...s.data} />
              </div>
            );
          }
          case 'richtext': {
            // `null` is a valid Fragment child and does not require a
            // key, but we still want to skip empty sections cleanly
            // without polluting the array with a keyed `null`.
            const html = sectionToHtml(s);
            if (!html) return null;
            return <RichTextBlock key={s.id} html={html.html} />;
          }
          case 'media': {
            return <MediaBlock key={s.id} {...s.data} />;
          }
          case 'rawhtml': {
            // rawhtml is a full HTML document rendered inside an iframe.
            // The public catch-all wraps multi-section pages in
            // <Container width="prose"> which would otherwise squeeze the
            // iframe into ~68ch. Wrap in `.diag-full-bleed` to escape the
            // Container's max-width while preserving the section's order
            // in the flow. When the page has only this one section
            // (`isFullLanding`), there's no Container ancestor and the
            // class is a harmless no-op.
            return (
              <div key={s.id} className="diag-full-bleed">
                <RawHtmlBlock html={s.data.html} />
              </div>
            );
          }
          case 'form': {
            return <FormBlock key={s.id} {...s.data} />;
          }
          case 'divider': {
            return <DividerBlock key={s.id} />;
          }
          case 'categories': {
            return <CategoryBlock key={s.id} {...s.data} />;
          }
          case 'posts': {
            return <PostsBlock key={s.id} {...s.data} />;
          }
        }
      })}
    </>
  );
}
