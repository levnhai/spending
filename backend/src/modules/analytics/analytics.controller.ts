import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';

@ApiTags('Analytics & Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Lấy các chỉ số thẻ tổng quan Dashboard' })
  getDashboardSummary(@Request() req: any) {
    return this.analyticsService.getDashboardSummary(req.user.userId);
  }

  @Get('pie-chart')
  @ApiOperation({ summary: 'Dữ liệu biểu đồ tròn tỷ lệ chi tiêu danh mục' })
  @ApiQuery({ name: 'month', required: false })
  @ApiQuery({ name: 'year', required: false })
  getPieChartCategoryData(@Request() req: any, @Query('month') month?: number, @Query('year') year?: number) {
    return this.analyticsService.getPieChartCategoryData(req.user.userId, month, year);
  }

  @Get('bar-chart')
  @ApiOperation({ summary: 'Dữ liệu biểu đồ cột so sánh Thu vs Chi theo tháng' })
  @ApiQuery({ name: 'year', required: false })
  getBarChartMonthlyComparison(@Request() req: any, @Query('year') year?: number) {
    return this.analyticsService.getBarChartMonthlyComparison(req.user.userId, year);
  }

  @Get('line-chart')
  @ApiOperation({ summary: 'Dữ liệu biểu đồ đường biến động chi tiêu theo ngày' })
  @ApiQuery({ name: 'month', required: false })
  @ApiQuery({ name: 'year', required: false })
  getLineChartDailyTrend(@Request() req: any, @Query('month') month?: number, @Query('year') year?: number) {
    return this.analyticsService.getLineChartDailyTrend(req.user.userId, month, year);
  }

  @Get('top-categories')
  @ApiOperation({ summary: 'Top danh mục chi nhiều nhất' })
  @ApiQuery({ name: 'month', required: false })
  @ApiQuery({ name: 'year', required: false })
  getTopSpendingCategories(@Request() req: any, @Query('month') month?: number, @Query('year') year?: number) {
    return this.analyticsService.getTopSpendingCategories(req.user.userId, month, year);
  }

  @Get('weekly-chart')
  @ApiOperation({ summary: 'Dữ liệu biểu đồ so sánh Thu vs Chi theo tuần hiện tại' })
  getWeeklyComparison(@Request() req: any) {
    return this.analyticsService.getWeeklyComparison(req.user.userId);
  }

  @Get('income-pie-chart')
  @ApiOperation({ summary: 'Dữ liệu biểu đồ tròn tỷ lệ thu nhập theo danh mục' })
  @ApiQuery({ name: 'month', required: false })
  @ApiQuery({ name: 'year', required: false })
  getIncomePieChartCategoryData(@Request() req: any, @Query('month') month?: number, @Query('year') year?: number) {
    return this.analyticsService.getIncomePieChartCategoryData(req.user.userId, month, year);
  }

  @Get('compare-months')
  @ApiOperation({ summary: 'So sánh báo cáo tài chính giữa 2 tháng' })
  @ApiQuery({ name: 'm1', required: true })
  @ApiQuery({ name: 'y1', required: true })
  @ApiQuery({ name: 'm2', required: true })
  @ApiQuery({ name: 'y2', required: true })
  compareMonths(
    @Request() req: any,
    @Query('m1') m1: number,
    @Query('y1') y1: number,
    @Query('m2') m2: number,
    @Query('y2') y2: number,
  ) {
    return this.analyticsService.compareMonths(req.user.userId, Number(m1), Number(y1), Number(m2), Number(y2));
  }

  @Get('compare-days')
  @ApiOperation({ summary: 'So sánh thu chi giữa 2 ngày bất kỳ' })
  @ApiQuery({ name: 'date1', required: true })
  @ApiQuery({ name: 'date2', required: true })
  compareDays(@Request() req: any, @Query('date1') date1: string, @Query('date2') date2: string) {
    return this.analyticsService.compareDays(req.user.userId, date1, date2);
  }
}
