import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WalletsService } from './wallets.service';
import { CreateWalletDto, UpdateWalletDto } from './dto/wallet.dto';

@ApiTags('Wallets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wallets')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách ví/tài khoản của tôi' })
  findAll(@Request() req: any) {
    return this.walletsService.findAll(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Xem chi tiết ví' })
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.walletsService.findOne(req.user.userId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo mới ví/tài khoản' })
  create(@Request() req: any, @Body() dto: CreateWalletDto) {
    return this.walletsService.create(req.user.userId, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin ví' })
  update(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateWalletDto) {
    return this.walletsService.update(req.user.userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa ví' })
  remove(@Request() req: any, @Param('id') id: string) {
    return this.walletsService.remove(req.user.userId, id);
  }
}
