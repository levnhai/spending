import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SavingsGoal, SavingsGoalSchema } from '../../schemas/savings-goal.schema';
import { Wallet, WalletSchema } from '../../schemas/wallet.schema';
import { Transaction, TransactionSchema } from '../../schemas/transaction.schema';
import { SavingsGoalsService } from './savings-goals.service';
import { SavingsGoalsController } from './savings-goals.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SavingsGoal.name, schema: SavingsGoalSchema },
      { name: Wallet.name, schema: WalletSchema },
      { name: Transaction.name, schema: TransactionSchema },
    ]),
  ],
  controllers: [SavingsGoalsController],
  providers: [SavingsGoalsService],
  exports: [SavingsGoalsService],
})
export class SavingsGoalsModule {}
