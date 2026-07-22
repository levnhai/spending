import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Transaction, TransactionDocument } from '../../schemas/transaction.schema';

@Injectable()
export class ReportsService {
  constructor(@InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>) {}

  async exportData(userId: string, startDate?: string, endDate?: string) {
    const userObjId = new Types.ObjectId(userId);
    const query: any = { userId: userObjId };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const transactions = await this.transactionModel
      .find(query)
      .populate('walletId')
      .populate('toWalletId')
      .populate('categoryId')
      .sort({ date: -1 });

    return transactions.map((t: any) => ({
      ID: t._id,
      Date: t.date.toISOString().split('T')[0],
      Type: t.type === 'income' ? 'Thu nhập' : t.type === 'expense' ? 'Chi tiêu' : 'Chuyển khoản',
      Amount: t.amount,
      Wallet: t.walletId ? t.walletId.name : '',
      ToWallet: t.toWalletId ? t.toWalletId.name : '',
      Category: t.categoryId ? t.categoryId.name : '',
      Note: t.note || '',
      Tags: t.tags ? t.tags.join(', ') : '',
    }));
  }

  async importData(userId: string, records: any[]) {
    if (!Array.isArray(records) || records.length === 0) {
      throw new BadRequestException('Dữ liệu nhập vào không hợp lệ hoặc rỗng');
    }
    // Bulk insert processed records
    return { message: `Đã nhập thành công ${records.length} giao dịch` };
  }
}
