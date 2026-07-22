import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RecurringBill, RecurringBillSchema } from '../../schemas/recurring-bill.schema';
import { RecurringBillsService } from './recurring-bills.service';
import { RecurringBillsController } from './recurring-bills.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: RecurringBill.name, schema: RecurringBillSchema }])],
  controllers: [RecurringBillsController],
  providers: [RecurringBillsService],
  exports: [RecurringBillsService],
})
export class RecurringBillsModule {}
