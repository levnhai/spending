import { Controller, Get, Put, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Xem danh sách thông báo' })
  findAll(@Request() req: any) {
    return this.notifService.findAll(req.user.userId);
  }

  @Put(':id/read')
  @ApiOperation({ summary: 'Đánh dấu 1 thông báo là đã đọc' })
  markAsRead(@Request() req: any, @Param('id') id: string) {
    return this.notifService.markAsRead(req.user.userId, id);
  }

  @Put('read-all')
  @ApiOperation({ summary: 'Đánh dấu tất cả thông báo đã đọc' })
  markAllAsRead(@Request() req: any) {
    return this.notifService.markAllAsRead(req.user.userId);
  }
}
