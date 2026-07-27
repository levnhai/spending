import { Controller, Get, Post, Delete, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MonthlyPlansService } from './monthly-plans.service';
import { SaveMonthlyPlanDto } from './dto/monthly-plan.dto';

@ApiTags('MonthlyPlans')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('monthly-plans')
export class MonthlyPlansController {
  constructor(private readonly plansService: MonthlyPlansService) {}

  @Get('current')
  @ApiOperation({ summary: 'Lấy bản kế hoạch chi tiêu tháng kèm so sánh thực tế' })
  getPlan(
    @Request() req: any,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    const now = new Date();
    const m = month ? Number(month) : now.getMonth() + 1;
    const y = year ? Number(year) : now.getFullYear();
    return this.plansService.getPlan(req.user.userId, m, y);
  }

  @Get('suggestions')
  @ApiOperation({ summary: 'Lấy gợi ý hóa đơn cố định, nợ, tiết kiệm sẵn có từ hệ thống' })
  getSuggestions(@Request() req: any) {
    return this.plansService.getSuggestions(req.user.userId);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo mới hoặc cập nhật bản kế hoạch chi tiêu tháng' })
  savePlan(@Request() req: any, @Body() dto: SaveMonthlyPlanDto) {
    return this.plansService.savePlan(req.user.userId, dto);
  }

  @Delete()
  @ApiOperation({ summary: 'Xóa bản kế hoạch chi tiêu tháng' })
  removePlan(
    @Request() req: any,
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    return this.plansService.removePlan(req.user.userId, Number(month), Number(year));
  }
}
