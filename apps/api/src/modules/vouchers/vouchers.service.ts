import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class VouchersService {
  constructor(private prisma: PrismaService) {}

  getPrograms() {
    return this.prisma.voucherProgram.findMany({
      where: { isActive: true },
      include: { _count: { select: { vouchers: true } } },
    });
  }

  getMyVouchers(userId: string) {
    return this.prisma.voucher.findMany({
      where: { userId },
      include: { program: { select: { name: true } }, transactions: { take: 5, orderBy: { createdAt: 'desc' } } },
    });
  }

  async findByCode(code: string) {
    const voucher = await this.prisma.voucher.findUnique({
      where: { code },
      include: { program: true },
    });
    if (!voucher) throw new NotFoundException('Voucher no encontrado');
    return voucher;
  }

  async redeem(code: string, userId: string, amount: number) {
    const voucher = await this.prisma.voucher.findUnique({ where: { code } });
    if (!voucher) throw new NotFoundException('Voucher no encontrado');
    if (voucher.status !== 'active') throw new BadRequestException('Voucher no activo');
    if (new Decimal(voucher.balance).lessThan(amount)) throw new BadRequestException('Saldo insuficiente');

    const newBalance = new Decimal(voucher.balance).minus(amount);

    await this.prisma.$transaction([
      this.prisma.voucher.update({
        where: { id: voucher.id },
        data: {
          balance: newBalance,
          status: newBalance.equals(0) ? 'used' : 'active',
          userId: voucher.userId ?? userId,
        },
      }),
      this.prisma.voucherTransaction.create({
        data: { voucherId: voucher.id, amount, type: 'redeem', reference: userId },
      }),
    ]);

    return { redeemed: true, newBalance: Number(newBalance) };
  }
}
