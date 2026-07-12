import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { CashService } from './cash.service';
import type { PrismaService } from '../../prisma/prisma.service';
import { ListingStatus } from '@lefrig/shared';

describe('CashService', () => {
  let service: CashService;
  let prisma: {
    listing: {
      findUnique: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
    cashAgreement: {
      create: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
    };
    cashConfirmation: {
      create: ReturnType<typeof vi.fn>;
      count: ReturnType<typeof vi.fn>;
    };
    cashReceipt: { create: ReturnType<typeof vi.fn> };
    $transaction: ReturnType<typeof vi.fn>;
  };

  const buyerId = 'buyer-uuid';
  const sellerId = 'seller-uuid';
  const listingId = 'listing-uuid';

  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    prisma = {
      listing: {
        findUnique: vi.fn(),
        update: vi.fn().mockResolvedValue({}),
      },
      cashAgreement: {
        create: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        findMany: vi.fn(),
      },
      cashConfirmation: {
        create: vi.fn().mockResolvedValue({}),
        count: vi.fn(),
      },
      cashReceipt: { create: vi.fn() },
      $transaction: vi.fn().mockResolvedValue([]),
    };

    service = new CashService(prisma as unknown as PrismaService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('createAgreement genera PIN, reserva listing y devuelve acuerdo', async () => {
    prisma.listing.findUnique.mockResolvedValue({
      id: listingId,
      status: ListingStatus.ACTIVE,
    });
    prisma.cashAgreement.create.mockResolvedValue({
      operationCode: 'CASH-ABCD1234',
      pin: '5500',
      listingId,
      buyerId,
      sellerId,
      amount: 1500,
      status: 'agreed',
      listing: { title: 'Móvil Samsung' },
      buyer: { displayName: 'Comprador' },
      seller: { displayName: 'Vendedor' },
    });

    const result = await service.createAgreement({
      listingId,
      buyerId,
      sellerId,
      amount: 1500,
    });

    expect(prisma.cashAgreement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          buyerId,
          sellerId,
          listingId,
          amount: 1500,
          status: 'agreed',
          pin: expect.stringMatching(/^\d{4}$/),
        }),
      }),
    );
    expect(prisma.listing.update).toHaveBeenCalledWith({
      where: { id: listingId },
      data: { status: ListingStatus.RESERVED },
    });
    expect(result.operationCode).toMatch(/^CASH-/);
  });

  it('createAgreement rechaza listing ya reservado', async () => {
    prisma.listing.findUnique.mockResolvedValue({
      id: listingId,
      status: ListingStatus.RESERVED,
    });

    await expect(
      service.createAgreement({ listingId, buyerId, sellerId, amount: 100 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('confirm valida PIN y registra confirmación del comprador', async () => {
    prisma.cashAgreement.findUnique.mockResolvedValue({
      id: 'agreement-1',
      operationCode: 'CASH-TEST',
      pin: '1234',
      status: 'agreed',
      buyerId,
      sellerId,
      listingId,
      amount: 500,
      confirmations: [],
    });
    prisma.cashConfirmation.count.mockResolvedValue(1);

    const result = await service.confirm(buyerId, { operationCode: 'CASH-TEST', pin: '1234' });

    expect(prisma.cashConfirmation.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        confirmedById: buyerId,
        role: 'buyer',
        pinVerified: true,
      }),
    });
    expect(result).toEqual({ confirmed: true, role: 'buyer', fullyConfirmed: false });
  });

  it('confirm con PIN incorrecto lanza BadRequest', async () => {
    prisma.cashAgreement.findUnique.mockResolvedValue({
      id: 'agreement-1',
      operationCode: 'CASH-TEST',
      pin: '1234',
      status: 'agreed',
      buyerId,
      sellerId,
      confirmations: [],
    });

    await expect(
      service.confirm(buyerId, { operationCode: 'CASH-TEST', pin: '9999' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('confirm bilateral genera recibo y marca listing vendido', async () => {
    prisma.cashAgreement.findUnique.mockResolvedValue({
      id: 'agreement-1',
      operationCode: 'CASH-FULL',
      pin: '5678',
      status: 'agreed',
      buyerId,
      sellerId,
      listingId,
      amount: 800,
      confirmations: [{ confirmedById: buyerId }],
    });
    prisma.cashConfirmation.count.mockResolvedValue(2);

    const result = await service.confirm(sellerId, { operationCode: 'CASH-FULL', pin: '5678' });

    expect(result.fullyConfirmed).toBe(true);
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it('confirm rechaza usuario ajeno a la operación', async () => {
    prisma.cashAgreement.findUnique.mockResolvedValue({
      id: 'agreement-1',
      operationCode: 'CASH-TEST',
      pin: '1234',
      status: 'agreed',
      buyerId,
      sellerId,
      confirmations: [],
    });

    await expect(
      service.confirm('outsider-uuid', { operationCode: 'CASH-TEST', pin: '1234' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('getReceipt devuelve texto compartible tras confirmación bilateral', async () => {
    const issuedAt = new Date('2026-07-08T12:00:00Z');
    prisma.cashAgreement.findUnique.mockResolvedValue({
      operationCode: 'CASH-RCPT',
      buyerId,
      sellerId,
      amount: 1200,
      currency: 'MRU',
      status: 'confirmed',
      listing: { title: 'Generador' },
      buyer: { displayName: 'Ahmed' },
      seller: { displayName: 'Fatima' },
      receipts: [{ id: 'rcpt-1', issuedAt, amount: 1200 }],
    });

    const receipt = await service.getReceipt('CASH-RCPT', buyerId);

    expect(receipt.operationCode).toBe('CASH-RCPT');
    expect(receipt.amount).toBe(1200);
    expect(receipt.shareText).toContain('CASH-RCPT');
    expect(receipt.shareText).toContain('Generador');
  });

  it('getReceipt rechaza acceso de terceros', async () => {
    prisma.cashAgreement.findUnique.mockResolvedValue({
      operationCode: 'CASH-RCPT',
      buyerId,
      sellerId,
      status: 'confirmed',
      receipts: [{ id: 'rcpt-1', issuedAt: new Date(), amount: 100 }],
      buyer: { displayName: 'A' },
      seller: { displayName: 'B' },
      listing: null,
      amount: 100,
      currency: 'MRU',
    });

    await expect(service.getReceipt('CASH-RCPT', 'outsider')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('findByCode oculta PIN a usuarios no implicados', async () => {
    prisma.cashAgreement.findUnique.mockResolvedValue({
      operationCode: 'CASH-VIEW',
      pin: '4321',
      status: 'agreed',
      buyerId,
      sellerId,
      buyer: { id: buyerId, displayName: 'B' },
      seller: { id: sellerId, displayName: 'S' },
      listing: { id: listingId, title: 'Item' },
      confirmations: [],
      receipts: [],
    });

    const publicView = await service.findByCode('CASH-VIEW');
    expect(publicView.pin).toBeUndefined();
    expect(publicView.hasPin).toBe(true);

    const sellerView = await service.findByCode('CASH-VIEW', sellerId);
    expect(sellerView.pin).toBe('4321');
  });

  it('findByCode lanza NotFound si no existe', async () => {
    prisma.cashAgreement.findUnique.mockResolvedValue(null);
    await expect(service.findByCode('CASH-MISSING')).rejects.toBeInstanceOf(NotFoundException);
  });
});
