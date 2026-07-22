import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument } from '../../schemas/notification.schema';

@Injectable()
export class NotificationsService {
  constructor(@InjectModel(Notification.name) private notifModel: Model<NotificationDocument>) {}

  async findAll(userId: string) {
    return this.notifModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(30);
  }

  async markAsRead(userId: string, id: string) {
    const notif = await this.notifModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) },
      { $set: { isRead: true } },
      { new: true },
    );
    if (!notif) throw new NotFoundException('Thông báo không tồn tại');
    return notif;
  }

  async markAllAsRead(userId: string) {
    await this.notifModel.updateMany(
      { userId: new Types.ObjectId(userId), isRead: false },
      { $set: { isRead: true } },
    );
    return { message: 'Đã đánh dấu tất cả thông báo là đã đọc' };
  }

  async createNotification(userId: string, title: string, message: string, type = 'info') {
    return this.notifModel.create({
      userId: new Types.ObjectId(userId),
      title,
      message,
      type,
      isRead: false,
    });
  }
}
