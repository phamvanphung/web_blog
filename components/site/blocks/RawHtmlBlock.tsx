type Props = {
  html: string;
};

export function RawHtmlBlock({ html }: Props) {
  return (
    <div className="prose-raw" dangerouslySetInnerHTML={{ __html: html }} />
  );
}
