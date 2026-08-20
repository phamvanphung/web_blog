import type { Section } from '@/modules/pages/types';
import { sectionToHtml } from '@/modules/pages/server/render';
import { HeroBlock } from './blocks/HeroBlock';
import { CtaBlock } from './blocks/CtaBlock';
import { RichTextBlock } from './blocks/RichTextBlock';
import { MediaBlock } from './blocks/MediaBlock';
import { RawHtmlBlock } from './blocks/RawHtmlBlock';
import { DividerBlock } from './blocks/DividerBlock';
import { FormBlock } from './blocks/FormBlock';

export function BlockRenderer({ sections }: { sections: Section[] }) {
  return (
    <>
      {sections.map((s) => {
        switch (s.kind) {
          case 'hero': {
            return <HeroBlock key={s.id} {...s.data} />;
          }
          case 'cta': {
            return <CtaBlock key={s.id} {...s.data} />;
          }
          case 'richtext': {
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
              <div className="diag-full-bleed">
                <RawHtmlBlock key={s.id} html={s.data.html} />
              </div>
            );
          }
          case 'form': {
            return <FormBlock key={s.id} {...s.data} />;
          }
          case 'divider': {
            return <DividerBlock key={s.id} />;
          }
        }
      })}
    </>
  );
}
