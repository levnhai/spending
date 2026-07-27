import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Debt, DebtDocument, DebtStatus, DebtType } from '../../schemas/debt.schema';
import { Wallet, WalletDocument } from '../../schemas/wallet.schema';
import { CreateDebtDto, UpdateDebtDto, RecordPaymentDto } from './dto/debt.dto';

@Injectable()
export class DebtsService {
  constructor(
    @InjectModel(Debt.name) private debtModel: Model<DebtDocument>,
    @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
  ) {}

  async findAll(userId: string) {
    return this.debtModel
      .find({ userId: new Types.ObjectId(userId) })
      .populate('walletId', 'name type color icon')
      .sort({ createdAt: -1 });
  }

  async findOne(userId: string, debtId: string) {
    const debt = await this.debtModel
      .findOne({
        _id: new Types.ObjectId(debtId),
        userId: new Types.ObjectId(userId),
      })
      .populate('walletId', 'name type color icon');

    if (!debt) throw new NotFoundException('Không tìm thấy khoản nợ/cho mượn');
    return debt;
  }

  async create(userId: string, dto: CreateDebtDto) {
    const userObjId = new Types.ObjectId(userId);
    let walletObjId: Types.ObjectId | undefined;

    if (dto.walletId) {
      walletObjId = new Types.ObjectId(dto.walletId);
      const wallet = await this.walletModel.findOne({ _id: walletObjId, userId: userObjId });
      if (!wallet) throw new NotFoundException('Ví chọn không tồn tại');

      // Tự động điều chỉnh số dư ví khi tạo khoản nợ mới kèm ví liên kết
      if (dto.type === DebtType.BORROWED) {
        // Nhận tiền đi vay vào ví -> Tăng tiền trong ví
        wallet.currentBalance += dto.amount;
      } else if (dto.type === DebtType.LENT) {
        // Xuất tiền cho mượn từ ví -> Giảm tiền trong ví
        wallet.currentBalance -= dto.amount;
      }
      await wallet.save();
    }

    const newDebt = await this.debtModel.create({
      userId: userObjId,
      personName: dto.personName,
      phone: dto.phone,
      type: dto.type,
      amount: dto.amount,
      paidAmount: 0,
      startDate: dto.startDate ? new Date(dto.startDate) : new Date(),
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      walletId: walletObjId,
      status: DebtStatus.UNPAID,
      notes: dto.notes,
      payments: [],
    });

    return newDebt;
  }

  async update(userId: string, debtId: string, dto: UpdateDebtDto) {
    const userObjId = new Types.ObjectId(userId);
    const debtObjId = new Types.ObjectId(debtId);

    const debt = await this.debtModel.findOne({ _id: debtObjId, userId: userObjId });
    if (!debt) throw new NotFoundException('Không tìm thấy khoản nợ/cho mượn');

    if (dto.personName) debt.personName = dto.personName;
    if (dto.phone !== undefined) debt.phone = dto.phone;
    if (dto.amount !== undefined) debt.amount = dto.amount;
    if (dto.startDate) debt.startDate = new Date(dto.startDate);
    if (dto.dueDate !== undefined) debt.dueDate = dto.dueDate ? new Date(dto.dueDate) : undefined;
    if (dto.notes !== undefined) debt.notes = dto.notes;

    // Cập nhật lại status dựa trên paidAmount mới và amount mới
    if (debt.paidAmount >= debt.amount) {
      debt.status = DebtStatus.PAID;
    } else if (debt.paidAmount > 0) {
      debt.status = DebtStatus.PARTIAL;
    } else {
      debt.status = DebtStatus.UNPAID;
    }

    await debt.save();
    return debt;
  }

  async recordPayment(userId: string, debtId: string, dto: RecordPaymentDto) {
    const userObjId = new Types.ObjectId(userId);
    const debtObjId = new Types.ObjectId(debtId);

    const debt = await this.debtModel.findOne({ _id: debtObjId, userId: userObjId });
    if (!debt) throw new NotFoundException('Không tìm thấy khoản nợ/cho mượn');

    const remaining = debt.amount - debt.paidAmount;
    if (remaining <= 0) {
      throw new BadRequestException('Khoản nợ này đã được thanh toán hoàn tất');
    }

    let walletObjId: Types.ObjectId | undefined;
    if (dto.walletId) {
      walletObjId = new Types.ObjectId(dto.walletId);
      const wallet = await this.walletModel.findOne({ _id: walletObjId, userId: userObjId });
      if (!wallet) throw new NotFoundException('Ví được chọn không tồn tại');

      // Tự động điều chỉnh số dư ví khi trả/thu nợ
      if (debt.type === DebtType.BORROWED) {
        // Tôi trả nợ cho người khác -> Trích tiền khỏi ví
        wallet.currentBalance -= dto.amount;
      } else if (debt.type === DebtType.LENT) {
        // Người khác trả nợ cho tôi -> Nhận tiền vào ví
        wallet.currentBalance += dto.amount;
      }
      await wallet.save();
    }

    debt.paidAmount += dto.amount;
    if (debt.paidAmount >= debt.amount) {
      debt.status = DebtStatus.PAID;
    } else {
      debt.status = DebtStatus.PARTIAL;
    }

    debt.payments.push({
      amount: dto.amount,
      date: dto.date ? new Date(dto.date) : new Date(),
      walletId: walletObjId,
      note: dto.note,
    });

    await debt.save();
    return debt;
  }

  async remove(userId: string, debtId: string) {
    const result = await this.debtModel.deleteOne({
      _id: new Types.ObjectId(debtId),
      userId: new Types.ObjectId(userId),
    });
    if (result.deletedCount === 0) throw new NotFoundException('Không tìm thấy khoản nợ');
    return { message: 'Xóa khoản nợ thành công' };
  }
}
