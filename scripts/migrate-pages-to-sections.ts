import 'dotenv/config';

/**
 * One-shot migration: convert existing Page.content (longtext) into a single
 * richtext section stored in Page.sections (JSON).
 *
 * Idempotent — running twice is a no-op (rows with `sections IS NOT NULL` are skipped).
 *
 * Usage:
 *   pnpm tsx scripts/migrate-pages-to-sections.ts
 *   # or
 *   pnpm migrate:pages-to-sections
 */

import { db } from '../lib/db';
import { Prisma } from '@prisma/client';
import type { Section } from '../modules/pages/types';

function contentToRichtextSection(content: string): Section {
  return {
    kind: 'richtext',
    id: 'sec_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    data: {
      json: {
        type: 'doc',
        content: content.length
          ? [{ type: 'paragraph', content: [{ type: 'text', text: content }] }]
          : [{ type: 'paragraph' }]
      }
    }
  };
}

async function main() {
  // Query pages where sections is null using raw SQL (Prisma JSON filter doesn't support null directly)
  const rows = await db.$queryRaw<Array<{ id: string; content: string | null; title: string }>>(
    Prisma.sql`SELECT id, content, title FROM Page WHERE sections IS NULL LIMIT 100`
  );
  console.log(`Found ${rows.length} pages without sections.`);

  let migrated = 0;
  for (const r of rows) {
    const section = contentToRichtextSection(r.content ?? '');
    await db.page.update({
      where: { id: r.id },
      data: { sections: [section] }
    });
    migrated++;
    console.log(`✓ ${r.title} (${r.id})`);
  }

  console.log(`\nMigrated ${migrated}/${rows.length} pages.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
