import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { pinConfirmSchema, ListingStatus } from '@lefrig/shared';
import { randomBytes, randomInt } from 'crypto';
import { RateLimitService } from '../../common/rate-limit/rate-limit.service';
import { buildCashReceiptPdf } from './cash-receipt-pdf';

const PIN_FAIL_LIMIT = 5;
const PIN_FAIL_WINDOW_SEC = 15 * 60;
const CONFIRM_USER_LIMIT = 20;
const CONFIRM_USER_WINDOW_SEC = 15 * 60;

@Injectable()
export class CashService {
  constructor(
    private prisma: PrismaService,
    private rateLimit: RateLimitService,
  ) {}

  async createAgreement(data: {
    listingId?: string;
    buyerId: string;
    sellerId: string;
    amount: number;
    method?: string;
  }) {
    if (data.buyerId === data.sellerId) {
      throw new BadRequestException('El comprador y el vendedor no pueden ser la misma persona');
    }

    if (data.listingId) {
      const listing = await this.prisma.listing.findUnique({ where: { id: data.listingId } });
      if (!listing) throw new NotFoundException('Anuncio no encontrado');
      if (listing.sellerId !== data.sellerId) {
        throw new BadRequestException('El vendedor no coincide con el anuncio');
      }
      if (listing.status === ListingStatus.RESERVED) {
        throw new BadRequestException('Este anuncio ya tiene un acuerdo de efectivo activo');
      }
      if (listing.status === ListingStatus.SOLD) {
        throw new BadRequestException('Este anuncio ya está vendido');
      }
    }

    const operationCode = `CASH-${randomBytes(4).toString('hex').toUpperCase()}`;
    const pin = String(randomInt(1000, 10000));

    const agreement = await this.prisma.$transaction(async (tx) => {
      const created = await tx.cashAgreement.create({
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
        await tx.listing.update({
          where: { id: data.listingId },
          data: { status: ListingStatus.RESERVED },
        });
      }

      return created;
    });

    // Creator is always buyer — never return PIN on create
    const { pin: _pin, ...safe } = agreement;
    return {
      ...safe,
      hasPin: true,
      role: 'buyer' as const,
      myConfirmed: false,
      canConfirm: true,
      confirmationCount: 0,
    };
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

    const role =
      userId && agreement.buyerId === userId
        ? ('buyer' as const)
        : userId && agreement.sellerId === userId
          ? ('seller' as const)
          : null;
    const myConfirmed = Boolean(
      userId && agreement.confirmations.some((c) => c.confirmedById === userId),
    );
    const canConfirm = Boolean(role && agreement.status === 'agreed' && !myConfirmed);
    const showPin = role === 'seller' && agreement.status === 'agreed';

    const { pin, ...safe } = agreement;
    return {
      ...safe,
      hasPin: !!pin,
      pin: showPin ? pin : undefined,
      role,
      myConfirmed,
      canConfirm,
      confirmationCount: agreement.confirmations.length,
      receipt: agreement.receipts[0] ?? null,
    };
  }

  async confirm(userId: string, input: unknown) {
    const { operationCode, pin } = pinConfirmSchema.parse(input);

    const userAllowed = await this.rateLimit.isAllowed(
      `cash:confirm:user:${userId}`,
      CONFIRM_USER_LIMIT,
      CONFIRM_USER_WINDOW_SEC,
    );
    if (!userAllowed) {
      throw new HttpException(
        'Demasiados intentos de confirmación. Inténtalo más tarde.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const failKey = `cash:pinfail:${operationCode}:${userId}`;
    const priorFails = await this.rateLimit.getCount(failKey);
    if (priorFails >= PIN_FAIL_LIMIT) {
      throw new HttpException(
        'PIN bloqueado temporalmente por demasiados intentos fallidos.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const agreement = await tx.cashAgreement.findUnique({
          where: { operationCode },
          include: { confirmations: true },
        });
        if (!agreement) throw new NotFoundException('Operación no encontrada');
        if (agreement.status === 'confirmed') {
          throw new BadRequestException('Esta operación ya está confirmada');
        }

        const role =
          agreement.buyerId === userId ? 'buyer' : agreement.sellerId === userId ? 'seller' : null;
        if (!role) throw new BadRequestException('No eres parte de esta operación');

        if (agreement.pin !== pin) {
          await this.rateLimit.increment(failKey, PIN_FAIL_WINDOW_SEC);
          throw new BadRequestException('PIN incorrecto');
        }

        const already = agreement.confirmations.some((c) => c.confirmedById === userId);
        if (already) throw new BadRequestException('Ya confirmaste esta operación');

        await tx.cashConfirmation.create({
          data: { agreementId: agreement.id, confirmedById: userId, role, pinVerified: true },
        });

        const confirmations = await tx.cashConfirmation.count({
          where: { agreementId: agreement.id },
        });

        if (confirmations >= 2) {
          await tx.cashAgreement.update({
            where: { id: agreement.id },
            data: { status: 'confirmed' },
          });
          await tx.cashReceipt.create({
            data: { agreementId: agreement.id, amount: agreement.amount },
          });
          if (agreement.listingId) {
            await tx.listing.update({
              where: { id: agreement.listingId },
              data: { status: ListingStatus.SOLD },
            });
          }
        }

        return { confirmed: true as const, role, fullyConfirmed: confirmations >= 2 };
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new BadRequestException('Ya confirmaste esta operación');
      }
      throw err;
    }
  }

  async getReceipt(operationCode: string, userId: string) {
    const data = await this.loadReceiptData(operationCode, userId);
    const shareText = [
      'ⵣ Lefrig — Recibo efectivo',
      `Código: ${data.operationCode}`,
      `Importe: ${data.amount.toLocaleString()} ${data.currency}`,
      data.listingTitle ? `Artículo: ${data.listingTitle}` : null,
      `Comprador: ${data.buyerName}`,
      `Vendedor: ${data.sellerName}`,
      `Fecha: ${data.issuedAt.toISOString().slice(0, 10)}`,
      'Confirmado con PIN bilateral · lefrig.com',
    ]
      .filter(Boolean)
      .join('\n');

    return { ...data, shareText };
  }

  async getReceiptPdf(operationCode: string, userId: string): Promise<Buffer> {
    const data = await this.loadReceiptData(operationCode, userId);
    return buildCashReceiptPdf(data);
  }

  private async loadReceiptData(operationCode: string, userId: string) {
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
    return {
      receiptId: receipt.id,
      operationCode: agreement.operationCode,
      amount: Number(agreement.amount),
      currency: agreement.currency,
      issuedAt: receipt.issuedAt,
      listingTitle: agreement.listing?.title ?? null,
      buyerName: agreement.buyer.displayName,
      sellerName: agreement.seller.displayName,
    };
  }

  findByUser(userId: string) {
    return this.prisma.cashAgreement
      .findMany({
        where: { OR: [{ buyerId: userId }, { sellerId: userId }] },
        orderBy: { createdAt: 'desc' },
        include: {
          listing: { select: { title: true } },
          receipts: { orderBy: { issuedAt: 'desc' }, take: 1 },
          confirmations: { select: { confirmedById: true, role: true } },
        },
      })
      .then((rows) =>
        rows.map(({ pin, receipts, confirmations, ...a }) => {
          const role = a.buyerId === userId ? ('buyer' as const) : ('seller' as const);
          const myConfirmed = confirmations.some((c) => c.confirmedById === userId);
          return {
            ...a,
            pin: role === 'seller' && a.status === 'agreed' ? pin : undefined,
            hasReceipt: receipts.length > 0,
            confirmationCount: confirmations.length,
            myConfirmed,
            role,
            canConfirm: a.status === 'agreed' && !myConfirmed,
          };
        }),
      );
  }
}
