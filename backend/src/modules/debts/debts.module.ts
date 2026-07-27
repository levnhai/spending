import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Debt, DebtSchema } from '../../schemas/debt.schema';
import { Wallet, WalletSchema } from '../../schemas/wallet.schema';
import { DebtsController } from './debts.controller';
import { DebtsService } from './debts.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Debt.name, schema: DebtSchema },
      { name: Wallet.name, schema: WalletSchema },
    ]),
  ],
  controllers: [DebtsController],
  providers: [DebtsService],
  exports: [DebtsService],
})
export class DebtsModule {}
