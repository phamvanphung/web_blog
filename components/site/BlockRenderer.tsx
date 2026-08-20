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
            return <RawHtmlBlock key={s.id} html={s.data.html} />;
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
