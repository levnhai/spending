import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Category, CategoryDocument, CategoryType } from '../../schemas/category.schema';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Injectable()
export class CategoriesService {
  constructor(@InjectModel(Category.name) private categoryModel: Model<CategoryDocument>) {}

  async findAll(userId: string, type?: CategoryType) {
    const filter: any = {
      $or: [{ userId: new Types.ObjectId(userId) }, { userId: null, isSystem: true }],
    };
    if (type) {
      filter.type = type;
    }
    return this.categoryModel.find(filter).sort({ name: 1 });
  }

  async create(userId: string, dto: CreateCategoryDto) {
    const category = await this.categoryModel.create({
      ...dto,
      userId: new Types.ObjectId(userId),
      isSystem: false,
    });
    return category;
  }

  async update(userId: string, id: string, dto: UpdateCategoryDto) {
    const userObjId = new Types.ObjectId(userId);
    const catObjId = new Types.ObjectId(id);

    const category = await this.categoryModel.findOneAndUpdate(
      { _id: catObjId, $or: [{ userId: userObjId }, { isSystem: true }] },
      { $set: dto },
      { new: true },
    );
    if (!category) throw new NotFoundException('Không tìm thấy danh mục hoặc không có quyền sửa');
    return category;
  }

  async remove(userId: string, id: string) {
    const userObjId = new Types.ObjectId(userId);
    const catObjId = new Types.ObjectId(id);

    const result = await this.categoryModel.deleteOne({
      _id: catObjId,
      $or: [{ userId: userObjId }, { isSystem: true }],
    });
    if (result.deletedCount === 0) throw new NotFoundException('Không tìm thấy danh mục hoặc không có quyền xóa');
    return { message: 'Đã xóa danh mục' };
  }
}
