import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { createCreditEntrySchema } from '@lefrig/shared';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class LedgerService {
  constructor(private prisma: PrismaService) {}

  async getAccounts(userId: string) {
    return this.prisma.creditAccount.findMany({
      where: { OR: [{ debtorId: userId }, { creditorId: userId }] },
      include: {
        shop: { select: { name: true, slug: true } },
        debtor: { select: { displayName: true } },
        creditor: { select: { displayName: true } },
      },
    });
  }

  async getAccount(id: string, userId: string) {
    const account = await this.prisma.creditAccount.findUnique({
      where: { id },
      include: {
        entries: { orderBy: { createdAt: 'desc' }, take: 50 },
        payments: { orderBy: { paidAt: 'desc' } },
        agreements: true,
        shop: true,
      },
    });
    if (!account) throw new NotFoundException('Cuenta no encontrada');
    if (account.debtorId !== userId && account.creditorId !== userId) {
      throw new ForbiddenException('No autorizado');
    }
    return account;
  }

  async addEntry(input: unknown) {
    const data = createCreditEntrySchema.parse(input);
    const account = await this.prisma.creditAccount.findUnique({ where: { id: data.accountId } });
    if (!account) throw new NotFoundException('Cuenta no encontrada');

    const delta = data.type === 'debt' ? data.amount : -data.amount;
    const newBalance = new Decimal(account.balance).plus(delta);

    const [entry] = await this.prisma.$transaction([
      this.prisma.creditEntry.create({
        data: {
          accountId: data.accountId,
          type: data.type,
          amount: data.amount,
          balanceAfter: newBalance,
          notes: data.notes,
        },
      }),
      this.prisma.creditAccount.update({
        where: { id: data.accountId },
        data: { balance: newBalance, lastUpdated: new Date() },
      }),
    ]);

    return entry;
  }

  async recordPayment(accountId: string, userId: string, amount: number, method = 'cash', notes?: string) {
    const account = await this.prisma.creditAccount.findUnique({ where: { id: accountId } });
    if (!account) throw new NotFoundException('Cuenta no encontrada');
    if (account.debtorId !== userId && account.creditorId !== userId) {
      throw new ForbiddenException('No autorizado');
    }

    const newBalance = new Decimal(account.balance).minus(amount);

    const [payment] = await this.prisma.$transaction([
      this.prisma.creditPayment.create({
        data: { accountId, amount, method, notes },
      }),
      this.prisma.creditEntry.create({
        data: {
          accountId,
          type: 'payment',
          amount,
          balanceAfter: newBalance,
          notes,
        },
      }),
      this.prisma.creditAccount.update({
        where: { id: accountId },
        data: { balance: newBalance, lastUpdated: new Date() },
      }),
    ]);

    return payment;
  }
}
