import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Wallet, WalletDocument } from '../../schemas/wallet.schema';
import { CreateWalletDto, UpdateWalletDto } from './dto/wallet.dto';

@Injectable()
export class WalletsService {
  constructor(@InjectModel(Wallet.name) private walletModel: Model<WalletDocument>) {}

  async findAll(userId: string) {
    return this.walletModel.find({ userId: new Types.ObjectId(userId) }).sort({ createdAt: -1 });
  }

  async findOne(userId: string, walletId: string) {
    const wallet = await this.walletModel.findOne({
      _id: new Types.ObjectId(walletId),
      userId: new Types.ObjectId(userId),
    });
    if (!wallet) throw new NotFoundException('Không tìm thấy ví/tài khoản');
    return wallet;
  }

  async create(userId: string, dto: CreateWalletDto) {
    const count = await this.walletModel.countDocuments({ userId: new Types.ObjectId(userId) });
    const newWallet = await this.walletModel.create({
      ...dto,
      userId: new Types.ObjectId(userId),
      currentBalance: dto.initialBalance,
      isDefault: count === 0,
    });
    return newWallet;
  }

  async update(userId: string, walletId: string, dto: UpdateWalletDto) {
    const wallet = await this.walletModel.findOneAndUpdate(
      { _id: new Types.ObjectId(walletId), userId: new Types.ObjectId(userId) },
      { $set: dto },
      { new: true },
    );
    if (!wallet) throw new NotFoundException('Không tìm thấy ví');
    return wallet;
  }

  async remove(userId: string, walletId: string) {
    const result = await this.walletModel.deleteOne({
      _id: new Types.ObjectId(walletId),
      userId: new Types.ObjectId(userId),
    });
    if (result.deletedCount === 0) throw new NotFoundException('Không tìm thấy ví');
    return { message: 'Đã xóa ví thành công' };
  }
}
