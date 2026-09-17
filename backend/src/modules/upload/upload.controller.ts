import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UploadService } from './upload.service';

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('order-image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadOrderImage(
    @UploadedFile() file?: any,
    @Body('base64') base64?: string,
  ) {
    if (file) {
      const url = await this.uploadService.saveFile(file);
      return { url, message: 'Upload ảnh thành công' };
    }

    if (base64) {
      const url = await this.uploadService.saveBase64(base64);
      return { url, message: 'Upload ảnh thành công' };
    }

    throw new BadRequestException('Vui lòng cung cấp file ảnh hoặc chuỗi base64');
  }
}

