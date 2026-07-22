import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto, FilterTransactionDto } from './dto/transaction.dto';

@ApiTags('Transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @ApiOperation({ summary: 'Thêm giao dịch mới (Thu/Chi/Chuyển khoản)' })
  create(@Request() req: any, @Body() dto: CreateTransactionDto) {
    return this.transactionsService.create(req.user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Xem danh sách & Tìm kiếm / Lọc giao dịch' })
  findAll(@Request() req: any, @Query() filter: FilterTransactionDto) {
    return this.transactionsService.findAll(req.user.userId, filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết 1 giao dịch' })
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.transactionsService.findOne(req.user.userId, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa giao dịch' })
  remove(@Request() req: any, @Param('id') id: string) {
    return this.transactionsService.remove(req.user.userId, id);
  }
}
