import { Module } from '@nestjs/common';
import { VouchersController } from './vouchers.controller';
import { VouchersService } from './vouchers.service';

/**
 * Conservado para reactivación futura.
 * NO montar en AppModule: POST /vouchers/redeem no debe estar en producción.
 */
@Module({
  controllers: [VouchersController],
  providers: [VouchersService],
})
export class VouchersModule {}
