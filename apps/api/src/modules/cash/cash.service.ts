import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { pinConfirmSchema, ListingStatus } from '@lefrig/shared';
import { randomBytes } from 'crypto';

@Injectable()
export class CashService {
  constructor(private prisma: PrismaService) {}

  async createAgreement(data: {
    listingId?: string;
    buyerId: string;
    sellerId: string;
    amount: number;
    method?: string;
  }) {
    if (data.listingId) {
      const listing = await this.prisma.listing.findUnique({ where: { id: data.listingId } });
      if (!listing) throw new NotFoundException('Anuncio no encontrado');
      if (listing.status === ListingStatus.RESERVED) {
        throw new BadRequestException('Este anuncio ya tiene un acuerdo de efectivo activo');
      }
      if (listing.status === ListingStatus.SOLD) {
        throw new BadRequestException('Este anuncio ya está vendido');
      }
    }

    const operationCode = `CASH-${randomBytes(4).toString('hex').toUpperCase()}`;
    const pin = String(Math.floor(1000 + Math.random() * 9000));

    const agreement = await this.prisma.cashAgreement.create({
      data: {
        operationCode,
        listingId: data.listingId,
        buyerId: data.buyerId,
        sellerId: data.sellerId,
        amount: data.amount,
        method: data.method ?? 'cash',
        status: 'agreed',
        pin,
      },
      include: {
        listing: { select: { title: true } },
        buyer: { select: { displayName: true } },
        seller: { select: { displayName: true } },
      },
    });

    if (data.listingId) {
      await this.prisma.listing.update({
        where: { id: data.listingId },
        data: { status: ListingStatus.RESERVED },
      });
    }

    return agreement;
  }

  async findByCode(operationCode: string, userId?: string) {
    const agreement = await this.prisma.cashAgreement.findUnique({
      where: { operationCode },
      include: {
        buyer: { select: { id: true, displayName: true } },
        seller: { select: { id: true, displayName: true } },
        listing: { select: { id: true, title: true } },
        confirmations: true,
        receipts: { orderBy: { issuedAt: 'desc' }, take: 1 },
      },
    });
    if (!agreement) throw new NotFoundException('Operación no encontrada');

    const isParty = userId && (agreement.buyerId === userId || agreement.sellerId === userId);
    const showPin =
      isParty &&
      agreement.status === 'agreed' &&
      (agreement.sellerId === userId || agreement.buyerId === userId);

    const { pin, ...safe } = agreement;
    return {
      ...safe,
      hasPin: !!pin,
      pin: showPin ? pin : undefined,
      confirmationCount: agreement.confirmations.length,
      receipt: agreement.receipts[0] ?? null,
    };
  }

  async confirm(userId: string, input: unknown) {
    const { operationCode, pin } = pinConfirmSchema.parse(input);
    const agreement = await this.prisma.cashAgreement.findUnique({
      where: { operationCode },
      include: { confirmations: true },
    });
    if (!agreement) throw new NotFoundException('Operación no encontrada');
    if (agreement.status === 'confirmed') {
      throw new BadRequestException('Esta operación ya está confirmada');
    }
    if (agreement.pin !== pin) throw new BadRequestException('PIN incorrecto');

    const role = agreement.buyerId === userId ? 'buyer' : agreement.sellerId === userId ? 'seller' : null;
    if (!role) throw new BadRequestException('No eres parte de esta operación');

    const already = agreement.confirmations.some((c) => c.confirmedById === userId);
    if (already) throw new BadRequestException('Ya confirmaste esta operación');

    await this.prisma.cashConfirmation.create({
      data: { agreementId: agreement.id, confirmedById: userId, role, pinVerified: true },
    });

    const confirmations = await this.prisma.cashConfirmation.count({ where: { agreementId: agreement.id } });
    if (confirmations >= 2) {
      await this.prisma.$transaction([
        this.prisma.cashAgreement.update({
          where: { id: agreement.id },
          data: { status: 'confirmed' },
        }),
        this.prisma.cashReceipt.create({
          data: { agreementId: agreement.id, amount: agreement.amount },
        }),
        ...(agreement.listingId
          ? [
              this.prisma.listing.update({
                where: { id: agreement.listingId },
                data: { status: ListingStatus.SOLD },
              }),
            ]
          : []),
      ]);
    }

    return { confirmed: true, role, fullyConfirmed: confirmations >= 2 };
  }

  async getReceipt(operationCode: string, userId: string) {
    const agreement = await this.prisma.cashAgreement.findUnique({
      where: { operationCode },
      include: {
        buyer: { select: { displayName: true } },
        seller: { select: { displayName: true } },
        listing: { select: { title: true } },
        receipts: { orderBy: { issuedAt: 'desc' }, take: 1 },
      },
    });
    if (!agreement) throw new NotFoundException('Operación no encontrada');
    if (agreement.buyerId !== userId && agreement.sellerId !== userId) {
      throw new ForbiddenException('No tienes acceso a este recibo');
    }
    if (agreement.status !== 'confirmed' || !agreement.receipts[0]) {
      throw new BadRequestException('El recibo estará disponible cuando ambas partes confirmen');
    }

    const receipt = agreement.receipts[0];
    const amount = Number(agreement.amount);
    const shareText = [
      'ⵣ Lefrig — Recibo efectivo',
      `Código: ${agreement.operationCode}`,
      `Importe: ${amount.toLocaleString()} ${agreement.currency}`,
      agreement.listing?.title ? `Artículo: ${agreement.listing.title}` : null,
      `Comprador: ${agreement.buyer.displayName}`,
      `Vendedor: ${agreement.seller.displayName}`,
      `Fecha: ${receipt.issuedAt.toISOString().slice(0, 10)}`,
      'Confirmado con PIN bilateral · lefrig.com',
    ]
      .filter(Boolean)
      .join('\n');

    return {
      receiptId: receipt.id,
      operationCode: agreement.operationCode,
      amount,
      currency: agreement.currency,
      issuedAt: receipt.issuedAt,
      listingTitle: agreement.listing?.title ?? null,
      buyerName: agreement.buyer.displayName,
      sellerName: agreement.seller.displayName,
      shareText,
    };
  }

  findByUser(userId: string) {
    return this.prisma.cashAgreement.findMany({
      where: { OR: [{ buyerId: userId }, { sellerId: userId }] },
      orderBy: { createdAt: 'desc' },
      include: {
        listing: { select: { title: true } },
        receipts: { orderBy: { issuedAt: 'desc' }, take: 1 },
        confirmations: { select: { confirmedById: true, role: true } },
      },
    }).then((rows) =>
      rows.map(({ pin, receipts, confirmations, ...a }) => ({
        ...a,
        pin: a.sellerId === userId && a.status === 'agreed' ? pin : undefined,
        hasReceipt: receipts.length > 0,
        confirmationCount: confirmations.length,
        myConfirmed: confirmations.some((c) => c.confirmedById === userId),
      })),
    );
  }
}
