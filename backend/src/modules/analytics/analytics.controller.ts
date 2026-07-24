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
}
