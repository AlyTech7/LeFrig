import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { pinConfirmSchema } from '@lefrig/shared';
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
    const operationCode = `CASH-${randomBytes(4).toString('hex').toUpperCase()}`;
    const pin = String(Math.floor(1000 + Math.random() * 9000));

    return this.prisma.cashAgreement.create({
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
    });
  }

  async findByCode(operationCode: string) {
    const agreement = await this.prisma.cashAgreement.findUnique({
      where: { operationCode },
      include: {
        buyer: { select: { id: true, displayName: true } },
        seller: { select: { id: true, displayName: true } },
        listing: { select: { id: true, title: true } },
        confirmations: true,
      },
    });
    if (!agreement) throw new NotFoundException('Operación no encontrada');
    const { pin, ...safe } = agreement;
    return { ...safe, hasPin: !!pin };
  }

  async confirm(userId: string, input: unknown) {
    const { operationCode, pin } = pinConfirmSchema.parse(input);
    const agreement = await this.prisma.cashAgreement.findUnique({
      where: { operationCode },
    });
    if (!agreement) throw new NotFoundException('Operación no encontrada');
    if (agreement.pin !== pin) throw new BadRequestException('PIN incorrecto');

    const role = agreement.buyerId === userId ? 'buyer' : agreement.sellerId === userId ? 'seller' : null;
    if (!role) throw new BadRequestException('No eres parte de esta operación');

    await this.prisma.cashConfirmation.create({
      data: { agreementId: agreement.id, confirmedById: userId, role, pinVerified: true },
    });

    const confirmations = await this.prisma.cashConfirmation.count({ where: { agreementId: agreement.id } });
    if (confirmations >= 2) {
      await this.prisma.cashAgreement.update({
        where: { id: agreement.id },
        data: { status: 'confirmed' },
      });
      await this.prisma.cashReceipt.create({
        data: { agreementId: agreement.id, amount: agreement.amount },
      });
    }

    return { confirmed: true, role };
  }

  findByUser(userId: string) {
    return this.prisma.cashAgreement.findMany({
      where: { OR: [{ buyerId: userId }, { sellerId: userId }] },
      orderBy: { createdAt: 'desc' },
      include: { listing: { select: { title: true } } },
    });
  }
}
