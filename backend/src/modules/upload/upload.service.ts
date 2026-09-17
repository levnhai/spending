import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { join } from 'path';
import * as fs from 'fs';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly uploadsDir = join(process.cwd(), 'uploads', 'orders');
  private isConfigured = false;

  constructor(private readonly configService: ConfigService) {
    // Đảm bảo thư mục lưu trữ cục bộ luôn tồn tại làm fallback
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }

    this.initCloudinary();
  }

  /**
   * Khởi tạo cấu hình Cloudinary từ biến môi trường
   */
  private initCloudinary() {
    const cloudName =
      this.configService?.get<string>('CLOUDINARY_CLOUD_NAME') ||
      process.env.CLOUDINARY_CLOUD_NAME?.trim();
    const apiKey =
      this.configService?.get<string>('CLOUDINARY_API_KEY') ||
      process.env.CLOUDINARY_API_KEY?.trim();
    const apiSecret =
      this.configService?.get<string>('CLOUDINARY_API_SECRET') ||
      process.env.CLOUDINARY_API_SECRET?.trim();

    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });
      this.isConfigured = true;
      this.logger.log(`☁️ Cloudinary đã sẵn sàng kết nối (cloud_name: ${cloudName})`);
    } else {
      this.isConfigured = false;
      this.logger.warn(
        '⚠️ Chưa cấu hình đầy đủ Cloudinary (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET). Hệ thống sẽ tạm thời lưu ảnh cục bộ.',
      );
    }
  }

  /**
   * Kiểm tra Cloudinary đã được cấu hình hay chưa
   */
  isCloudinaryReady(): boolean {
    if (!this.isConfigured) {
      this.initCloudinary();
    }
    return this.isConfigured;
  }

  /**
   * Lấy thư mục Cloudinary theo cấu hình (mặc định: spending/orders)
   */
  private getUploadFolder(subfolder = 'orders'): string {
    const rootFolder =
      this.configService?.get<string>('CLOUDINARY_FOLDER')?.trim() ||
      process.env.CLOUDINARY_FOLDER?.trim() ||
      'spending';
    return `${rootFolder}/${subfolder}`;
  }

  /**
   * Lưu hoặc tải ảnh lên Cloudinary từ chuỗi Base64 Data URL
   */
  async saveBase64(base64Data: string, folder?: string): Promise<string> {
    if (!base64Data || typeof base64Data !== 'string') {
      throw new BadRequestException('Dữ liệu ảnh base64 không hợp lệ');
    }

    const uploadFolder = folder || this.getUploadFolder('orders');

    // Chuẩn hóa chuỗi base64 thành data URI chuẩn nếu thiếu header
    let dataUri = base64Data;
    if (!dataUri.startsWith('data:image/')) {
      dataUri = `data:image/jpeg;base64,${base64Data}`;
    }

    // Nếu đã cấu hình Cloudinary, upload trực tiếp lên Cloudinary
    if (this.isCloudinaryReady()) {
      try {
        const uploadRes = await cloudinary.uploader.upload(dataUri, {
          folder: uploadFolder,
          resource_type: 'image',
          transformation: [{ quality: 'auto:good', fetch_format: 'auto' }],
        });
        return uploadRes.secure_url;
      } catch (err) {
        this.logger.error(
          `❌ Upload Cloudinary thất bại: ${err.message}. Đang fallback lưu file cục bộ.`,
        );
      }
    }

    // Fallback: Lưu file tĩnh cục bộ
    return this.saveBase64ToLocal(dataUri);
  }

  /**
   * Lưu hoặc tải ảnh lên Cloudinary từ Multipart File
   */
  async saveFile(file: any, folder?: string): Promise<string> {
    if (!file || !file.buffer) {
      throw new BadRequestException('Vui lòng chọn file hình ảnh hợp lệ');
    }

    const uploadFolder = folder || this.getUploadFolder('orders');

    if (this.isCloudinaryReady()) {
      try {
        const mime = file.mimetype || 'image/jpeg';
        const base64String = `data:${mime};base64,${file.buffer.toString('base64')}`;
        const uploadRes = await cloudinary.uploader.upload(base64String, {
          folder: uploadFolder,
          resource_type: 'image',
          transformation: [{ quality: 'auto:good', fetch_format: 'auto' }],
        });
        return uploadRes.secure_url;
      } catch (err) {
        this.logger.error(
          `❌ Upload Cloudinary thất bại: ${err.message}. Đang fallback lưu file cục bộ.`,
        );
      }
    }

    // Fallback: Lưu file tĩnh cục bộ
    return this.saveFileToLocal(file);
  }

  /**
   * Tải file đã lưu ở ổ đĩa cục bộ lên Cloudinary
   */
  async uploadLocalFileToCloudinary(
    localPathOrFilename: string,
    folder?: string,
  ): Promise<string | null> {
    if (!this.isCloudinaryReady()) return null;

    const uploadFolder = folder || this.getUploadFolder('orders');

    try {
      let absolutePath = localPathOrFilename;
      if (localPathOrFilename.startsWith('/uploads/orders/')) {
        const filename = localPathOrFilename.replace('/uploads/orders/', '');
        absolutePath = join(this.uploadsDir, filename);
      } else if (!fs.existsSync(absolutePath)) {
        absolutePath = join(this.uploadsDir, localPathOrFilename);
      }

      if (!fs.existsSync(absolutePath)) {
        return null;
      }

      const uploadRes = await cloudinary.uploader.upload(absolutePath, {
        folder: uploadFolder,
        resource_type: 'image',
        transformation: [{ quality: 'auto:good', fetch_format: 'auto' }],
      });

      return uploadRes.secure_url;
    } catch (err) {
      this.logger.warn(`Không thể upload file local lên Cloudinary: ${err.message}`);
      return null;
    }
  }

  /**
   * Fallback lưu Base64 vào ổ cứng cục bộ
   */
  private saveBase64ToLocal(base64Data: string): string {
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
   * Fallback lưu Buffer vào ổ cứng cục bộ
   */
  private saveFileToLocal(file: any): string {
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
