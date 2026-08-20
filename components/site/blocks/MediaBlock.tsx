type Props = {
  mediaId: string;
  layout: 'full' | 'pair';
  caption?: string;
};

export function MediaBlock({ caption }: Props) {
  return (
    <figure>
      {/* TODO: fetch media URL by mediaId */}
      <img
        src="/public/hero-placeholder.svg"
        alt={caption ?? ''}
        className="w-full rounded-11"
      />
      {caption && <figcaption className="mt-2 text-center text-sm text-ink-muted-80">{caption}</figcaption>}
    </figure>
  );
}
