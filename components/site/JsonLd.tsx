// components/site/JsonLd.tsx
import type { JsonLd } from '@/modules/seo/types';

export function JsonLd({ data }: { data: JsonLd }) {
  return (
    <script
      type="application/ld+json"
      // Safe: data is built by our own builder, not user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
