/**
 * Tự động nén và tối ưu ảnh về chuẩn WebP/JPEG kích thước gọn nhẹ (~30KB - 70KB)
 * Giúp lưu trữ trực tiếp vào Database hoặc Data URI cực kỳ tối giản, không cần server file riêng
 */
export const compressImageFile = (
  file: File,
  maxWidth = 1600,
  maxHeight = 1600,
  quality = 0.82,
): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Vui lòng chọn file hình ảnh hợp lệ'));
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        try {
          // Xuất định dạng WebP siêu nhẹ, fallback sang JPEG nếu trình duyệt cũ
          const dataUrl = canvas.toDataURL('image/webp', quality);
          resolve(dataUrl);
        } catch (e) {
          const fallback = canvas.toDataURL('image/jpeg', quality);
          resolve(fallback);
        }
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};
