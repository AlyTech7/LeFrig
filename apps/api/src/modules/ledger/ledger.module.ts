import { Module } from '@nestjs/common';
import { LedgerController } from './ledger.controller';
import { LedgerService } from './ledger.service';

/**
 * Conservado para reactivación futura.
 * NO montar en AppModule: POST /ledger/entries era IDOR si queda expuesto.
 */
@Module({
  controllers: [LedgerController],
  providers: [LedgerService],
})
export class LedgerModule {}
