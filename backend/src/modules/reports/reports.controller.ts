import { Controller, Get, Post, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReportsService } from './reports.service';

@ApiTags('Reports Export & Import')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('export')
  @ApiOperation({ summary: 'Xuất dữ liệu giao dịch' })
  exportData(@Request() req: any, @Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.reportsService.exportData(req.user.userId, startDate, endDate);
  }

  @Post('import')
  @ApiOperation({ summary: 'Nhập dữ liệu giao dịch từ Excel/CSV' })
  importData(@Request() req: any, @Body() body: { records: any[] }) {
    return this.reportsService.importData(req.user.userId, body.records);
  }
}
