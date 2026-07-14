import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { CAMPS, LISTING_CATEGORIES, SERVICE_CATEGORIES } from '@lefrig/shared';

const prisma = new PrismaClient();
const OTP_MOCK = process.env.OTP_MOCK_CODE ?? '123456';

async function hashOtp(code: string) {
  return bcrypt.hash(code, 10);
}

async function main() {
  const profile = process.env.SEED_PROFILE ?? 'default';
  if (profile === 'staging') {
    console.log('🧪 SEED_PROFILE=staging — datos ficticios para entorno pre-producción');
  }
  console.log('🌱 Seeding LeFrig database...');

  // Camps
  const campRecords = await Promise.all(
    CAMPS.map((c) =>
      prisma.camp.upsert({
        where: { slug: c.slug },
        update: {},
        create: {
          slug: c.slug,
          nameAr: c.nameAr,
          nameEs: c.nameEs,
          nameEn: c.nameEn,
          isTindouf: c.isTindouf,
        },
      }),
    ),
  );
  const campBySlug = Object.fromEntries(campRecords.map((c) => [c.slug, c]));

  // Dairas (placeholder per camp)
  const dairaRecords: Record<string, { id: string }> = {};
  for (const camp of campRecords) {
    for (let i = 1; i <= 3; i++) {
      const d = await prisma.daira.upsert({
        where: { campId_slug: { campId: camp.id, slug: `daira-${i}` } },
        update: {},
        create: {
          campId: camp.id,
          slug: `daira-${i}`,
          nameAr: `دائرة ${i}`,
          nameEs: `Daira ${i}`,
          nameEn: `Daira ${i}`,
        },
      });
      if (i === 1) dairaRecords[camp.slug] = d;
    }
  }

  // Neighborhoods
  for (const camp of campRecords) {
    const daira = dairaRecords[camp.slug];
    await prisma.neighborhood.createMany({
      data: [
        { campId: camp.id, dairaId: daira?.id, nameAr: 'حي المركز', nameEs: 'Barrio Centro', nameEn: 'Central' },
        { campId: camp.id, dairaId: daira?.id, nameAr: 'حي الشمال', nameEs: 'Barrio Norte', nameEn: 'North' },
      ],
      skipDuplicates: true,
    });
  }

  // Market areas (marsas)
  const marsaRecords: Record<string, { id: string }> = {};
  for (const camp of campRecords.slice(0, 4)) {
    const m = await prisma.marketArea.upsert({
      where: { campId_slug: { campId: camp.id, slug: 'marsa-central' } },
      update: {},
      create: {
        campId: camp.id,
        slug: 'marsa-central',
        nameAr: 'السوق المركزي',
        nameEs: 'Mercado Central',
        nameEn: 'Central Market',
        description: 'Mercado principal del campamento',
      },
    });
    marsaRecords[camp.slug] = m;
  }

  // Pickup points
  const pickupPoints: Record<string, string> = {};
  for (const camp of campRecords) {
    const pp = await prisma.pickupPoint.create({
      data: {
        campId: camp.id,
        nameAr: 'نقطة التجمع',
        nameEs: 'Punto de recogida',
        nameEn: 'Pickup point',
        address: `Camp ${camp.slug}`,
      },
    });
    pickupPoints[camp.slug] = pp.id;
  }

  // Routes between camps
  const routePairs = [
    ['aaiun', 'smara'],
    ['aaiun', 'dakhla'],
    ['rabouni', 'tindouf'],
    ['smara', 'auserd'],
  ] as const;
  for (const [from, to] of routePairs) {
    await prisma.route.upsert({
      where: {
        originCampId_destinationCampId: {
          originCampId: campBySlug[from].id,
          destinationCampId: campBySlug[to].id,
        },
      },
      update: {},
      create: {
        originCampId: campBySlug[from].id,
        destinationCampId: campBySlug[to].id,
        nameAr: `${from} → ${to}`,
        nameEs: `${from} → ${to}`,
        distanceKm: 120,
        estimatedHours: 2.5,
      },
    });
  }

  // Categories
  const listingCats = await Promise.all(
    LISTING_CATEGORIES.map((cat, i) =>
      prisma.category.upsert({
        where: { slug: cat.slug },
        update: {},
        create: {
          slug: cat.slug,
          nameAr: cat.nameAr,
          nameEs: cat.nameEs,
          nameEn: cat.nameEs,
          icon: cat.icon,
          type: 'listing',
          sortOrder: i,
        },
      }),
    ),
  );
  await Promise.all(
    SERVICE_CATEGORIES.map((cat, i) =>
      prisma.category.upsert({
        where: { slug: `service-${cat.slug}` },
        update: {},
        create: {
          slug: `service-${cat.slug}`,
          nameAr: cat.nameAr,
          nameEs: cat.nameEs,
          nameEn: cat.nameEs,
          icon: cat.icon,
          type: 'service',
          sortOrder: i,
        },
      }),
    ),
  );
  const catBySlug = Object.fromEntries(listingCats.map((c) => [c.slug, c]));

  // Users
  const users = {
    admin: await prisma.user.upsert({
      where: { phone: '+213555123456' },
      update: {},
      create: {
        phone: '+213555123456',
        displayName: 'Admin LeFrig',
        roles: ['admin', 'moderator'],
        campId: campBySlug.aaiun.id,
        dairaId: dairaRecords.aaiun.id,
        verificationLevel: 'verified',
        reputationScore: 100,
        badges: ['phone_verified'],
      },
    }),
    seller: await prisma.user.upsert({
      where: { phone: '+213555111111' },
      update: {},
      create: {
        phone: '+213555111111',
        displayName: 'Ahmed Vendedor',
        roles: ['citizen', 'seller'],
        campId: campBySlug.aaiun.id,
        dairaId: dairaRecords.aaiun.id,
        verificationLevel: 'phone',
        reputationScore: 85,
        badges: ['phone_verified', 'community_recommended'],
      },
    }),
    shopOwner: await prisma.user.upsert({
      where: { phone: '+213555222222' },
      update: {},
      create: {
        phone: '+213555222222',
        displayName: 'Fatima Tienda',
        roles: ['citizen', 'shop_owner'],
        campId: campBySlug.smara.id,
        dairaId: dairaRecords.smara.id,
        verificationLevel: 'community',
        reputationScore: 90,
        badges: ['shop_verified', 'women_entrepreneur'],
      },
    }),
    driver: await prisma.user.upsert({
      where: { phone: '+213555333333' },
      update: {},
      create: {
        phone: '+213555333333',
        displayName: 'Mohamed Conductor',
        roles: ['citizen', 'driver'],
        campId: campBySlug.rabouni.id,
        dairaId: dairaRecords.rabouni.id,
        verificationLevel: 'verified',
        reputationScore: 92,
        badges: ['driver_verified'],
      },
    }),
    diaspora: await prisma.user.upsert({
      where: { phone: '+34600111222' },
      update: {},
      create: {
        phone: '+34600111222',
        displayName: 'Sara Diáspora',
        roles: ['citizen', 'diaspora'],
        preferredLanguage: 'es',
        verificationLevel: 'phone',
        reputationScore: 75,
      },
    }),
    ngo: await prisma.user.upsert({
      where: { phone: '+213555444444' },
      update: {},
      create: {
        phone: '+213555444444',
        displayName: 'ONG Solidaridad',
        roles: ['citizen', 'ngo'],
        campId: campBySlug.tindouf.id,
        dairaId: dairaRecords.tindouf.id,
        verificationLevel: 'partner',
        reputationScore: 95,
        badges: ['cooperative'],
      },
    }),
  };

  // OTP mock for admin
  await prisma.otpCode.create({
    data: {
      userId: users.admin.id,
      phone: users.admin.phone,
      codeHash: await hashOtp(OTP_MOCK),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });

  // Driver profile
  const driverProfile = await prisma.driverProfile.upsert({
    where: { userId: users.driver.id },
    update: {},
    create: {
      userId: users.driver.id,
      vehicleType: 'minibus',
      vehiclePlate: 'WS-1234',
      seatsCapacity: 8,
      isVerified: true,
      rating: 4.8,
      totalTrips: 156,
    },
  });

  await prisma.frequentRoute.create({
    data: {
      driverProfileId: driverProfile.id,
      originCampId: campBySlug.rabouni.id,
      destinationCampId: campBySlug.tindouf.id,
      frequency: 'daily',
    },
  });

  // Diaspora profile
  const diasporaProfile = await prisma.diasporaProfile.upsert({
    where: { userId: users.diaspora.id },
    update: {},
    create: {
      userId: users.diaspora.id,
      country: 'España',
      city: 'Madrid',
      beneficiaryName: 'Familia Saharaui',
      beneficiaryPhone: '+213555555555',
      preferredCampId: campBySlug.rabouni.id,
    },
  });

  // Shop
  const shop = await prisma.shop.upsert({
    where: { slug: 'tienda-fatima-smara' },
    update: {},
    create: {
      ownerId: users.shopOwner.id,
      campId: campBySlug.smara.id,
      dairaId: dairaRecords.smara.id,
      marsaId: marsaRecords.smara?.id,
      slug: 'tienda-fatima-smara',
      name: 'Tienda Fatima',
      description: 'Abarrotes y productos básicos',
      shopType: 'individual',
      phone: '+213555222222',
      acceptsCash: true,
      acceptsFiado: true,
      acceptsVouchers: true,
      verified: true,
    },
  });

  const products = await Promise.all([
    prisma.shopProduct.create({
      data: { shopId: shop.id, name: 'Arroz 5kg', price: 450, stock: 50 },
    }),
    prisma.shopProduct.create({
      data: { shopId: shop.id, name: 'Aceite 1L', price: 180, stock: 30 },
    }),
    prisma.shopProduct.create({
      data: { shopId: shop.id, name: 'Leche en polvo', price: 320, stock: 20 },
    }),
  ]);

  // Listings
  const listing = await prisma.listing.create({
    data: {
      sellerId: users.seller.id,
      categoryId: catBySlug.mobiles.id,
      campId: campBySlug.aaiun.id,
      dairaId: dairaRecords.aaiun.id,
      title: 'Samsung Galaxy A54 - Como nuevo',
      description: 'Teléfono en excelente estado, con cargador original. 128GB.',
      price: 8500,
      status: 'active',
      images: ['https://picsum.photos/seed/phone1/400/300'],
      paymentMethods: ['cash', 'fiado'],
      attributes: { brand: 'samsung', storage: '128', condition: 'like_new' },
    },
  });

  await prisma.listing.create({
    data: {
      sellerId: users.seller.id,
      categoryId: catBySlug.solar.id,
      campId: campBySlug.dakhla.id,
      dairaId: dairaRecords.dakhla.id,
      title: 'Panel solar 100W',
      description: 'Panel solar monocristalino, ideal para caravana.',
      price: 12000,
      status: 'active',
      paymentMethods: ['cash'],
    },
  });

  if (catBySlug.cars) {
    await prisma.listing.create({
      data: {
        sellerId: users.seller.id,
        categoryId: catBySlug.cars.id,
        campId: campBySlug.rabouni.id,
        dairaId: dairaRecords.rabouni?.id,
        title: 'Toyota Corolla 2018 — Rabouni',
        description: 'Coche familiar, bien mantenido. Pago en efectivo.',
        price: 185000,
        status: 'active',
        images: ['https://picsum.photos/seed/car1/400/300'],
        paymentMethods: ['cash'],
        attributes: {
          brand: 'toyota',
          model: 'Corolla',
          year: 2018,
          mileageKm: 92000,
          fuel: 'petrol',
          transmission: 'manual',
        },
      },
    });
  }

  // Services
  const serviceCat = await prisma.category.findFirst({ where: { slug: 'service-electrician' } });
  const service = await prisma.service.create({
    data: {
      providerId: users.seller.id,
      categoryId: serviceCat!.id,
      title: 'Electricista certificado',
      description: 'Instalaciones eléctricas y reparaciones domésticas.',
      priceFrom: 500,
      priceTo: 3000,
      camps: {
        create: [{ campId: campBySlug.aaiun.id }, { campId: campBySlug.smara.id }],
      },
    },
  });

  // Transport
  const transport = await prisma.transportRequest.create({
    data: {
      requesterId: users.seller.id,
      type: 'shared_ride',
      originCampId: campBySlug.rabouni.id,
      destinationCampId: campBySlug.tindouf.id,
      originHubSlug: 'rabouni',
      destinationHubSlug: 'tindouf',
      originLabel: 'Rabouni',
      destinationLabel: 'Tindouf (Argelia)',
      pickupPointId: pickupPoints.rabouni,
      dropoffPointId: pickupPoints.tindouf,
      description: 'Viaje compartido semanal',
      seatsAvailable: 4,
      seatsRequested: 2,
      isSharedRide: true,
    },
  });

  await prisma.transportRequest.create({
    data: {
      requesterId: users.diaspora.id,
      type: 'person',
      originHubSlug: 'madrid',
      destinationHubSlug: 'rabouni',
      originLabel: 'Madrid',
      destinationLabel: 'Rabouni',
      description: 'Familia en Madrid — busco conductor verificado',
      seatsRequested: 3,
      contactPhone: '+34600000000',
    },
  });

  await prisma.transportRequest.create({
    data: {
      requesterId: users.shopOwner.id,
      type: 'shared_ride',
      originCampId: campBySlug.rabouni.id,
      destinationCampId: campBySlug.rabouni.id,
      originHubSlug: 'rabouni',
      destinationHubSlug: 'nouakchott',
      originLabel: 'Rabouni',
      destinationLabel: 'Nuakchott',
      description: 'Corredor Mauritania — plazas disponibles',
      seatsRequested: 1,
      seatsAvailable: 5,
      isSharedRide: true,
    },
  });

  // Order
  const order = await prisma.order.create({
    data: {
      buyerId: users.diaspora.id,
      shopId: shop.id,
      beneficiaryId: users.seller.id,
      status: 'accepted',
      paymentMethod: 'fiado',
      paymentStatus: 'fiado',
      totalAmount: 630,
      notes: 'Para mi familia en Smara',
      items: {
        create: [
          { productId: products[0].id, name: 'Arroz 5kg', quantity: 1, unitPrice: 450, subtotal: 450 },
          { productId: products[1].id, name: 'Aceite 1L', quantity: 1, unitPrice: 180, subtotal: 180 },
        ],
      },
    },
  });

  // Cash agreement
  const cashAgreement = await prisma.cashAgreement.create({
    data: {
      operationCode: 'CASH-DEMO-001',
      listingId: listing.id,
      buyerId: users.shopOwner.id,
      sellerId: users.seller.id,
      amount: 8500,
      method: 'cash',
      status: 'agreed',
      pin: '1234',
    },
  });

  await prisma.cashConfirmation.create({
    data: {
      agreementId: cashAgreement.id,
      confirmedById: users.seller.id,
      role: 'seller',
      pinVerified: true,
    },
  });

  // Credit ledger
  const creditAccount = await prisma.creditAccount.create({
    data: {
      debtorId: users.seller.id,
      creditorId: users.shopOwner.id,
      shopId: shop.id,
      balance: 1200,
    },
  });

  await prisma.creditEntry.create({
    data: {
      accountId: creditAccount.id,
      type: 'debt',
      amount: 1200,
      balanceAfter: 1200,
      notes: 'Compra fiado demo',
    },
  });

  await prisma.creditAgreement.create({
    data: {
      accountId: creditAccount.id,
      amount: 1200,
      terms: 'Pago en 30 días',
      status: 'accepted',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  // Voucher program
  const voucherProgram = await prisma.voucherProgram.create({
    data: {
      name: 'Programa ONG Alimentos',
      description: 'Vouchers de ayuda alimentaria',
      sponsor: 'ONG Solidaridad',
      totalBudget: 50000,
      startsAt: new Date(),
      endsAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.voucher.create({
    data: {
      programId: voucherProgram.id,
      userId: users.seller.id,
      code: 'VOUCHER-DEMO-001',
      balance: 500,
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      transactions: {
        create: { amount: 500, type: 'issue', reference: 'initial' },
      },
    },
  });

  // Diaspora order
  await prisma.diasporaOrder.create({
    data: {
      profileId: diasporaProfile.id,
      orderType: 'essentials',
      description: 'Paquete de alimentos básicos para familia',
      budget: 2000,
      status: 'pending',
      campId: campBySlug.rabouni.id,
    },
  });

  // Jobs
  await prisma.job.create({
    data: {
      posterId: users.ngo.id,
      campId: campBySlug.tindouf.id,
      jobType: 'offer',
      category: 'skilled',
      title: 'Técnico solar',
      description: 'Instalación de paneles en viviendas del campamento.',
      salary: 8000,
    },
  });

  await prisma.job.create({
    data: {
      posterId: users.seller.id,
      campId: campBySlug.aaiun.id,
      jobType: 'seeking',
      category: 'daily',
      title: 'Busco trabajo de albañil',
      description: 'Experiencia de 5 años en construcción.',
    },
  });

  // Needs
  const need = await prisma.needRequest.create({
    data: {
      requesterId: users.seller.id,
      campId: campBySlug.aaiun.id,
      type: 'product',
      title: 'Necesito generador pequeño',
      description: 'Para uso doméstico, preferiblemente 2-3kW',
      category: 'solar',
      status: 'open',
    },
  });

  await prisma.needOffer.create({
    data: {
      needRequestId: need.id,
      offererId: users.shopOwner.id,
      message: 'Tengo un generador de 2.5kW disponible',
      priceEstimate: 15000,
    },
  });

  // Community posts
  await prisma.communityPost.create({
    data: {
      authorId: users.ngo.id,
      campId: campBySlug.tindouf.id,
      postType: 'campaign',
      title: 'Campaña de recogida de ropa de invierno',
      content: 'La ONG organiza recogida de ropa hasta el viernes en el mercado central.',
    },
  });

  // Conversation & messages
  const conversation = await prisma.conversation.create({
    data: {
      type: 'listing',
      refId: listing.id,
      participants: {
        create: [{ userId: users.seller.id }, { userId: users.shopOwner.id }],
      },
    },
  });

  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderId: users.shopOwner.id,
      content: '¿Sigue disponible el teléfono?',
    },
  });

  // Notifications
  await prisma.notification.create({
    data: {
      userId: users.seller.id,
      type: 'message',
      title: 'Nuevo mensaje',
      body: 'Fatima Tienda te ha enviado un mensaje',
      data: { conversationId: conversation.id },
    },
  });

  // Reviews
  await prisma.review.create({
    data: {
      authorId: users.shopOwner.id,
      targetType: 'user',
      targetId: users.seller.id,
      targetUserId: users.seller.id,
      rating: 5,
      comment: 'Vendedor muy confiable',
    },
  });

  await prisma.userBadge.create({
    data: { userId: users.seller.id, badge: 'community_recommended', reason: 'Seed demo' },
  });

  // Analytics (privacy-safe aggregates)
  const dispute = await prisma.dispute.create({
    data: {
      openerId: users.diaspora.id,
      respondentId: users.shopOwner.id,
      reason: 'not_as_described',
      description: 'El pedido de víveres no coincide con lo acordado en la tienda.',
      status: 'open',
      orderId: order.id,
      evidence: {
        create: [{ type: 'note', content: 'Solicito revisión del pedido demo seed.' }],
      },
    },
  });

  await prisma.analyticsEvent.createMany({
    data: [
      { eventType: 'search', term: 'solar', category: 'solar', campId: campBySlug.dakhla.id, bucket: '2025-06' },
      { eventType: 'search', term: 'telefono', category: 'mobiles', campId: campBySlug.aaiun.id, bucket: '2025-06', count: 12 },
      { eventType: 'listing_view', category: 'mobiles', campId: campBySlug.aaiun.id, value: 8500, bucket: '2025-06', count: 45 },
      { eventType: 'route_search', term: 'rabouni-tindouf', campId: campBySlug.rabouni.id, bucket: '2025-06', count: 8 },
    ],
  });

  // Escrow mock
  await prisma.escrowTransaction.create({
    data: {
      reference: 'ESCROW-MOCK-001',
      amount: 5000,
      status: 'mock_pending',
      buyerRef: users.shopOwner.id,
      sellerRef: users.seller.id,
      metadata: { note: 'Future online payment mock' },
    },
  });

  console.log('✅ Seed completed successfully');
  console.log(`   Camps: ${campRecords.length}`);
  console.log(`   Users: ${Object.keys(users).length}`);
  console.log(`   Dispute demo: ${dispute.id.slice(0, 8)}`);
  console.log(`   Admin OTP: ${OTP_MOCK}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
