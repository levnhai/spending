import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { CategoryType } from '../../schemas/category.schema';

@ApiTags('Categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách danh mục (Thu/Chi)' })
  @ApiQuery({ name: 'type', enum: CategoryType, required: false })
  findAll(@Request() req: any, @Query('type') type?: CategoryType) {
    return this.categoriesService.findAll(req.user.userId, type);
  }

  @Post()
  @ApiOperation({ summary: 'Thêm danh mục chi tiêu/thu nhập tùy chỉnh' })
  create(@Request() req: any, @Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(req.user.userId, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật danh mục' })
  update(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(req.user.userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa danh mục' })
  remove(@Request() req: any, @Param('id') id: string) {
    return this.categoriesService.remove(req.user.userId, id);
  }
}
