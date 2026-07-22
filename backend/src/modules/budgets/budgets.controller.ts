import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BudgetsService } from './budgets.service';
import { CreateBudgetDto, UpdateBudgetDto } from './dto/budget.dto';

@ApiTags('Budgets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('budgets')
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Get()
  @ApiOperation({ summary: 'Xem danh sách hạn mức ngân sách tháng/năm' })
  findAll(@Request() req: any, @Query('month') month: number, @Query('year') year: number) {
    const currentMonth = month ? Number(month) : new Date().getMonth() + 1;
    const currentYear = year ? Number(year) : new Date().getFullYear();
    return this.budgetsService.findAll(req.user.userId, currentMonth, currentYear);
  }

  @Post()
  @ApiOperation({ summary: 'Thiết lập/Cập nhật ngân sách danh mục' })
  create(@Request() req: any, @Body() dto: CreateBudgetDto) {
    return this.budgetsService.create(req.user.userId, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật số tiền hạn mức' })
  update(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateBudgetDto) {
    return this.budgetsService.update(req.user.userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa hạn mức ngân sách' })
  remove(@Request() req: any, @Param('id') id: string) {
    return this.budgetsService.remove(req.user.userId, id);
  }
}
