import { Injectable, BadRequestException } from '@nestjs/common';
import { join } from 'path';
import * as fs from 'fs';

@Injectable()
export class UploadService {
  private readonly uploadsDir = join(process.cwd(), 'uploads', 'orders');

  constructor() {
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  /**
   * Lưu ảnh từ chuỗi Base64 Data URL thành file tĩnh
   */
  saveBase64(base64Data: string): string {
    if (!base64Data || typeof base64Data !== 'string') {
      throw new BadRequestException('Dữ liệu ảnh base64 không hợp lệ');
    }

    // Tách header data:image/xxx;base64,...
    const matches = base64Data.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
    let ext = 'webp';
    let base64String = base64Data;

    if (matches && matches.length === 3) {
      ext = matches[1].toLowerCase();
      if (ext === 'jpeg') ext = 'jpg';
      base64String = matches[2];
    }

    const filename = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const filePath = join(this.uploadsDir, filename);

    const buffer = Buffer.from(base64String, 'base64');
    fs.writeFileSync(filePath, buffer);

    return `/uploads/orders/${filename}`;
  }

  /**
   * Lưu ảnh từ Multipart File buffer
   */
  saveFile(file: any): string {
    if (!file || !file.buffer) {
      throw new BadRequestException('Vui lòng chọn file hình ảnh');
    }

    const mime = file.mimetype || 'image/jpeg';
    let ext = 'jpg';
    if (mime.includes('webp')) ext = 'webp';
    else if (mime.includes('png')) ext = 'png';
    else if (mime.includes('jpeg') || mime.includes('jpg')) ext = 'jpg';

    const filename = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const filePath = join(this.uploadsDir, filename);

    fs.writeFileSync(filePath, file.buffer);

    return `/uploads/orders/${filename}`;
  }
}
