import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { AdminService } from './admin.service';
import {
  CreateAdminUserDto,
  GetUsersFilterDto,
  UpdateUserRoleDto,
  UpdateUserStatusDto,
  UpdateAdminUserDto,
  RenewSubscriptionDto,
} from './dto/admin.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  async getSystemStats() {
    return this.adminService.getSystemStats();
  }

  @Get('users')
  async getUsers(@Query() filter: GetUsersFilterDto) {
    return this.adminService.getUsers(filter);
  }

  @Get('users/:id')
  async getUserDetail(@Param('id') id: string) {
    return this.adminService.getUserDetail(id);
  }

  @Post('users')
  async createUser(@Body() dto: CreateAdminUserDto) {
    return this.adminService.createUser(dto);
  }

  @Post('users/:id/renew')
  async renewSubscription(
    @Param('id') id: string,
    @Body() dto: RenewSubscriptionDto,
  ) {
    return this.adminService.renewSubscription(id, dto);
  }

  @Patch('users/:id')
  async updateUser(
    @Param('id') id: string,
    @Body() dto: UpdateAdminUserDto,
    @Request() req: any,
  ) {
    return this.adminService.updateUser(id, dto, req.user.userId);
  }

  @Patch('users/:id/role')
  async updateUserRole(
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
    @Request() req: any,
  ) {
    return this.adminService.updateUserRole(id, dto, req.user.userId);
  }

  @Patch('users/:id/status')
  async updateUserStatus(
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
    @Request() req: any,
  ) {
    return this.adminService.updateUserStatus(id, dto, req.user.userId);
  }

  @Delete('users/:id')
  async deleteUser(@Param('id') id: string, @Request() req: any) {
    return this.adminService.deleteUser(id, req.user.userId);
  }
}
