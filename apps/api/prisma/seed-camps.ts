/**
 * Idempotent: upserts the shared CAMPS catalog into the DB.
 * Safe to run against production — does not create demo users/listings.
 */
import { PrismaClient } from '@prisma/client';
import { CAMPS } from '@lefrig/shared';

const prisma = new PrismaClient();

async function main() {
  console.log(`Seeding ${CAMPS.length} camps…`);
  for (const c of CAMPS) {
    const camp = await prisma.camp.upsert({
      where: { slug: c.slug },
      update: {
        nameAr: c.nameAr,
        nameEs: c.nameEs,
        nameEn: c.nameEn,
        isTindouf: c.isTindouf,
        isActive: true,
      },
      create: {
        slug: c.slug,
        nameAr: c.nameAr,
        nameEs: c.nameEs,
        nameEn: c.nameEn,
        isTindouf: c.isTindouf,
      },
    });
    console.log(`  ✓ ${camp.slug} (${camp.id})`);
  }
  const count = await prisma.camp.count({ where: { isActive: true } });
  console.log(`Done. Active camps: ${count}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
