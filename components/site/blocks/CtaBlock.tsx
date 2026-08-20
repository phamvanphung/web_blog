import { Tile } from '@/components/ui/Tile';
import { Container } from '@/components/ui/Container';

type Props = {
  title: string;
  body?: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
};

export function CtaBlock({ title, body, primaryLabel, primaryHref, secondaryLabel, secondaryHref }: Props) {
  return (
    <Tile tone="dark">
      <Container width="full" className="py-section text-center">
        <h2 className="text-d-md">{title}</h2>
        {body && <p className="mt-md text-body-muted">{body}</p>}
        <div className="mt-lg flex flex-wrap justify-center gap-3">
          <a href={primaryHref} className="button-pill primary">
            {primaryLabel}
          </a>
          {secondaryLabel && secondaryHref && (
            <a href={secondaryHref} className="button-pill secondary">
              {secondaryLabel}
            </a>
          )}
        </div>
      </Container>
    </Tile>
  );
}
