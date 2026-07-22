import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SavingsGoalsService } from './savings-goals.service';
import { CreateSavingsGoalDto, DepositSavingsDto } from './dto/savings-goal.dto';

@ApiTags('Savings Goals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('savings-goals')
export class SavingsGoalsController {
  constructor(private readonly goalsService: SavingsGoalsService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách mục tiêu tiết kiệm' })
  findAll(@Request() req: any) {
    return this.goalsService.findAll(req.user.userId);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo mục tiêu tiết kiệm mới' })
  create(@Request() req: any, @Body() dto: CreateSavingsGoalDto) {
    return this.goalsService.create(req.user.userId, dto);
  }

  @Put(':id/deposit')
  @ApiOperation({ summary: 'Nạp tiền tích lũy vào mục tiêu' })
  deposit(@Request() req: any, @Param('id') id: string, @Body() dto: DepositSavingsDto) {
    return this.goalsService.deposit(req.user.userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa mục tiêu tiết kiệm' })
  remove(@Request() req: any, @Param('id') id: string) {
    return this.goalsService.remove(req.user.userId, id);
  }
}
