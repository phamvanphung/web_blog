// Read-only diagnostic script. Lists sections of a page by ID.
// Usage: node scripts/read-page-sections.mjs <pageId>
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const id = process.argv[2];
if (!id) {
  console.error('Usage: node scripts/read-page-sections.mjs <pageId>');
  process.exit(1);
}

const adapter = new PrismaMariaDb(process.env.DATABASE_URL);
const prisma = new PrismaClient({ adapter });
const page = await prisma.page.findUnique({
  where: { id },
  select: { id: true, title: true, slug: true, status: true, sections: true }
});
if (!page) {
  console.log('NOT FOUND');
} else {
  console.log(JSON.stringify({
    id: page.id,
    title: page.title,
    slug: page.slug,
    status: page.status,
    sectionCount: Array.isArray(page.sections) ? page.sections.length : 'not-array',
    sections: page.sections
  }, null, 2));
}
await prisma.$disconnect();
