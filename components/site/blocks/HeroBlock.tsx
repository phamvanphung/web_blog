import { Tile } from '@/components/ui/Tile';
import { Container } from '@/components/ui/Container';

type Props = {
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
  mediaId?: string | null;
};

export function HeroBlock({ title, subtitle, ctaLabel, ctaHref, mediaId }: Props) {
  return (
    <Tile tone="parchment">
      <Container width="full" className="py-section text-center">
        <h1 className="text-d-lg">{title}</h1>
        {subtitle && <p className="mt-md text-lg text-ink-muted-80">{subtitle}</p>}
        {ctaLabel && ctaHref && (
          <a href={ctaHref} className="button-pill primary mt-lg inline-flex items-center gap-2">
            {ctaLabel}
          </a>
        )}
        {mediaId && (
          <div className="mt-xl">
            {/* TODO: fetch media by ID and render <img> */}
            <div className="bg-canvas-parchment rounded-18 h-64 w-full" />
          </div>
        )}
      </Container>
    </Tile>
  );
}
