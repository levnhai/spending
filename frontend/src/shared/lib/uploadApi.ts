import { api } from './api';

export interface UploadImageResponse {
  success: boolean;
  url: string;
  originalName?: string;
  size?: number;
}

export const uploadOrderImage = async (fileOrBase64: File | string): Promise<string> => {
  if (typeof fileOrBase64 === 'string') {
    // Nếu là chuỗi data:image/ base64
    const res = await api.post<UploadImageResponse>('/upload/order-image', {
      base64: fileOrBase64,
    });
    return res.data.url;
  }

  // Nếu là File object
  const formData = new FormData();
  formData.append('file', fileOrBase64);
  const res = await api.post<UploadImageResponse>('/upload/order-image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data.url;
};

/**
 * Trả về URL đầy đủ cho ảnh upload tĩnh nếu cần
 */
export const getFullImageUrl = (imageUrl?: string): string => {
  if (!imageUrl) return '';
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('data:image/')) {
    return imageUrl;
  }
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  const origin = apiBase.replace(/\/api\/?$/, '');
  const cleanPath = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
  return `${origin}${cleanPath}`;
};
