import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RecurringBillsService } from './recurring-bills.service';
import { CreateRecurringBillDto, UpdateRecurringBillDto } from './dto/recurring-bill.dto';

@ApiTags('Recurring Bills')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('recurring-bills')
export class RecurringBillsController {
  constructor(private readonly billsService: RecurringBillsService) {}

  @Get()
  @ApiOperation({ summary: 'Xem danh sách hóa đơn định kỳ' })
  findAll(@Request() req: any) {
    return this.billsService.findAll(req.user.userId);
  }

  @Post()
  @ApiOperation({ summary: 'Thêm hóa đơn định kỳ mới' })
  create(@Request() req: any, @Body() dto: CreateRecurringBillDto) {
    return this.billsService.create(req.user.userId, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin hóa đơn định kỳ' })
  update(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateRecurringBillDto) {
    return this.billsService.update(req.user.userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa hóa đơn định kỳ' })
  remove(@Request() req: any, @Param('id') id: string) {
    return this.billsService.remove(req.user.userId, id);
  }
}
