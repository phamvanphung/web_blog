// components/site/PostContent.tsx
// Render sanitised HTML from `posts.contentHtml` (already sanitised server-side
// by jsonToHtml). Server-rendered; no JS shipped.
type Props = { html: string };

export function PostContent({ html }: Props) {
  return (
    <div
      className="prose mt-8"
      // Server-side sanitised HTML — never trust client.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
