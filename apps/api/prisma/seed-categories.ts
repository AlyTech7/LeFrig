/**
 * Idempotent: upserts LISTING_CATEGORIES + SERVICE_CATEGORIES into the DB.
 * Safe to run against production — does not create demo users/listings.
 */
import { PrismaClient } from '@prisma/client';
import { LISTING_CATEGORIES, SERVICE_CATEGORIES } from '@lefrig/shared';

const prisma = new PrismaClient();

async function main() {
  console.log(`Seeding ${LISTING_CATEGORIES.length} listing categories…`);
  for (const [i, cat] of LISTING_CATEGORIES.entries()) {
    const row = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        nameAr: cat.nameAr,
        nameEs: cat.nameEs,
        nameEn: cat.nameEs,
        icon: cat.icon,
        type: 'listing',
        sortOrder: i,
        isActive: true,
      },
      create: {
        slug: cat.slug,
        nameAr: cat.nameAr,
        nameEs: cat.nameEs,
        nameEn: cat.nameEs,
        icon: cat.icon,
        type: 'listing',
        sortOrder: i,
      },
    });
    console.log(`  ✓ listing ${row.slug}`);
  }

  console.log(`Seeding ${SERVICE_CATEGORIES.length} service categories…`);
  for (const [i, cat] of SERVICE_CATEGORIES.entries()) {
    const slug = `service-${cat.slug}`;
    const row = await prisma.category.upsert({
      where: { slug },
      update: {
        nameAr: cat.nameAr,
        nameEs: cat.nameEs,
        nameEn: cat.nameEs,
        icon: cat.icon,
        type: 'service',
        sortOrder: i,
        isActive: true,
      },
      create: {
        slug,
        nameAr: cat.nameAr,
        nameEs: cat.nameEs,
        nameEn: cat.nameEs,
        icon: cat.icon,
        type: 'service',
        sortOrder: i,
      },
    });
    console.log(`  ✓ service ${row.slug}`);
  }

  const listingCount = await prisma.category.count({ where: { type: 'listing', isActive: true } });
  const serviceCount = await prisma.category.count({ where: { type: 'service', isActive: true } });
  console.log(`Done. Active listing: ${listingCount}, service: ${serviceCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
