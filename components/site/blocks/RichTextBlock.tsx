type Props = {
  html: string;
};

export function RichTextBlock({ html }: Props) {
  return (
    <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />
  );
}
