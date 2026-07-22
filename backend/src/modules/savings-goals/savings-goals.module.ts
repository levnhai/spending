import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SavingsGoal, SavingsGoalSchema } from '../../schemas/savings-goal.schema';
import { SavingsGoalsService } from './savings-goals.service';
import { SavingsGoalsController } from './savings-goals.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: SavingsGoal.name, schema: SavingsGoalSchema }])],
  controllers: [SavingsGoalsController],
  providers: [SavingsGoalsService],
  exports: [SavingsGoalsService],
})
export class SavingsGoalsModule {}
