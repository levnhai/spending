import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { QueryCustomerDto } from './dto/query-customer.dto';

@ApiTags('Customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @ApiOperation({ summary: 'Thêm mới khách hàng' })
  create(@Request() req: any, @Body() dto: CreateCustomerDto) {
    return this.customersService.create(req.user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách khách hàng của Sales' })
  findAll(@Request() req: any, @Query() query: QueryCustomerDto) {
    const isAdmin = req.user.role === 'ADMIN';
    return this.customersService.findAll(req.user.userId, query, isAdmin);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Lấy thống kê tổng quan khách hàng' })
  getStats(@Request() req: any) {
    const isAdmin = req.user.role === 'ADMIN';
    return this.customersService.getStats(req.user.userId, isAdmin);
  }

  @Post('sync-all')
  @ApiOperation({ summary: 'Đồng bộ lại toàn bộ công nợ và doanh số cho tất cả khách hàng' })
  syncAll(@Request() req: any) {
    return this.customersService.syncAllStats(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết khách hàng và lịch sử đơn hàng' })
  findOne(@Request() req: any, @Param('id') id: string) {
    const isAdmin = req.user.role === 'ADMIN';
    return this.customersService.findOne(req.user.userId, id, isAdmin);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin khách hàng' })
  update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    const isAdmin = req.user.role === 'ADMIN';
    return this.customersService.update(req.user.userId, id, dto, isAdmin);
  }

  @Post(':id/sync-stats')
  @ApiOperation({ summary: 'Đồng bộ lại công nợ và doanh số từ danh sách đơn hàng' })
  syncStats(@Request() req: any, @Param('id') id: string) {
    return this.customersService.syncStatsFromOrders(req.user.userId, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa khách hàng' })
  remove(@Request() req: any, @Param('id') id: string) {
    const isAdmin = req.user.role === 'ADMIN';
    return this.customersService.remove(req.user.userId, id, isAdmin);
  }
}
