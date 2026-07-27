import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DebtsService } from './debts.service';
import { CreateDebtDto, UpdateDebtDto, RecordPaymentDto } from './dto/debt.dto';

@ApiTags('Debts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('debts')
export class DebtsController {
  constructor(private readonly debtsService: DebtsService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách các khoản nợ và cho mượn' })
  findAll(@Request() req: any) {
    return this.debtsService.findAll(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết một khoản nợ/cho mượn' })
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.debtsService.findOne(req.user.userId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo mới khoản nợ hoặc khoản cho mượn' })
  create(@Request() req: any, @Body() dto: CreateDebtDto) {
    return this.debtsService.create(req.user.userId, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật khoản nợ/cho mượn' })
  update(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateDebtDto) {
    return this.debtsService.update(req.user.userId, id, dto);
  }

  @Post(':id/pay')
  @ApiOperation({ summary: 'Ghi nhận một đợt trả/thu nợ' })
  recordPayment(@Request() req: any, @Param('id') id: string, @Body() dto: RecordPaymentDto) {
    return this.debtsService.recordPayment(req.user.userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa khoản nợ/cho mượn' })
  remove(@Request() req: any, @Param('id') id: string) {
    return this.debtsService.remove(req.user.userId, id);
  }
}
