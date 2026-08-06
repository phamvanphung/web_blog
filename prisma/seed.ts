import 'dotenv/config';
import { PrismaClient, UserRole } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { hash } from '@node-rs/argon2';

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error('DATABASE_URL is not set');
}
const db = new PrismaClient({
  adapter: new PrismaMariaDb(url),
  log: ['error']
});

const ARGON_OPTS = {
  memoryCost: 19456,
  timeCost: 2,
  outputLen: 32,
  parallelism: 1
};

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@9ent.vn';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'changeme123!';

  const passwordHash = await hash(adminPassword, ARGON_OPTS);

  const admin = await db.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash, role: UserRole.ADMIN, status: 'ACTIVE' },
    create: {
      email: adminEmail,
      name: 'Admin',
      passwordHash,
      role: UserRole.ADMIN,
      status: 'ACTIVE'
    }
  });

  // Default settings
  const defaults: { key: string; value: string }[] = [
    { key: 'site.name', value: '9ent' },
    { key: 'site.tagline', value: 'Blog công ty 9ent' },
    { key: 'content.postsPerPage', value: '12' },
    { key: 'content.timezone', value: 'Asia/Ho_Chi_Minh' }
  ];
  for (const s of defaults) {
    await db.setting.upsert({ where: { key: s.key }, update: {}, create: s });
  }

  // eslint-disable-next-line no-console
  console.log('Seeded admin:', { id: admin.id, email: admin.email });
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
