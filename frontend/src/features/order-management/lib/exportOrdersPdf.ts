import jsPDF from 'jspdf';
import { Order } from '@/entities/order';
import { formatVND } from '@/shared/lib/formatters';

export interface CustomerExportInfo {
  name: string;
  phone: string;
  address: string;
  note?: string;
}

export interface ExportPdfOptions {
  customerInfo: CustomerExportInfo;
  orders: Order[];
  systemTitle?: string;
  fileName?: string;
}

// Tải ảnh an toàn để vẽ lên canvas
async function loadSafeImage(url?: string): Promise<HTMLImageElement | null> {
  if (!url) return null;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// Vẽ trực tiếp toàn bộ phiếu đơn hàng lên HTML5 Canvas (không dùng html2canvas -> 100% không bị lỗi oklch)
async function renderReceiptToCanvas(
  options: ExportPdfOptions,
  includeImages = true,
): Promise<HTMLCanvasElement> {
  const { customerInfo, orders, systemTitle = 'HỆ THỐNG QUẢN LÝ ĐƠN HÀNG 2H' } = options;

  // Tính toán số liệu
  let totalQty = 0;
  let totalAmount = 0;
  let totalPaid = 0;

  const items = await Promise.all(
    orders.map(async (order, index) => {
      const cust = order.customers?.[0];
      const qty = cust?.quantity || 1;
      const amount = Number(order.totalAmount) || 0;
      const paid = Number(order.paidAmount) || 0;
      const unitPrice = qty > 0 ? Math.round(amount / qty) : amount;

      totalQty += qty;
      totalAmount += amount;
      totalPaid += paid;

      const loadedImg = includeImages ? await loadSafeImage(order.imageUrl) : null;

      return {
        stt: index + 1,
        code: order.orderCode,
        title: order.title,
        note: order.note || cust?.note || '',
        image: loadedImg,
        qty,
        unitPrice,
        amount,
      };
    }),
  );

  const totalRemaining = Math.max(0, totalAmount - totalPaid);

  const now = new Date();
  const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const canvasWidth = 800;
  const tableStartY = 220;
  const rowHeight = 64;
  const tableHeight = 36 + items.length * rowHeight;
  const summaryBoxY = tableStartY + tableHeight + 16;
  const summaryBoxHeight = 135;
  const footerY = summaryBoxY + summaryBoxHeight + 35;
  const canvasHeight = Math.max(footerY + 130, 1130); // Tối thiểu khổ A4

  const canvas = document.createElement('canvas');
  // Scale 2x cho hình ảnh in sắc nét
  canvas.width = canvasWidth * 2;
  canvas.height = canvasHeight * 2;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Không thể tạo context 2D');

  ctx.scale(2, 2);

  // 1. Nền trắng toàn trang
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // 2. HEADER
  ctx.fillStyle = '#059669';
  ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(systemTitle.toUpperCase(), 40, 52);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 21px system-ui, -apple-system, sans-serif';
  ctx.fillText('PHIẾU GIAO HÀNG / BẢNG KÊ ĐƠN HÀNG', 40, 80);

  ctx.fillStyle = '#64748b';
  ctx.font = 'normal 11px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`Ngày in: ${dateStr}`, 760, 56);
  ctx.fillText(`Số lượng đơn: ${orders.length} đơn`, 760, 76);

  // Đường kẻ ngăn cách header
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(40, 96);
  ctx.lineTo(760, 96);
  ctx.stroke();

  // 3. THÔNG TIN KHÁCH HÀNG (DƯỚI HEADER)
  const custBoxY = 112;
  const custBoxHeight = customerInfo.note ? 92 : 78;

  ctx.fillStyle = '#f8fafc';
  drawRoundedRect(ctx, 40, custBoxY, 720, custBoxHeight, 10);
  ctx.fill();
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#059669';
  ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('THÔNG TIN KHÁCH HÀNG', 56, custBoxY + 22);

  // Khách hàng & SĐT
  ctx.fillStyle = '#64748b';
  ctx.font = 'normal 12px system-ui, -apple-system, sans-serif';
  ctx.fillText('Khách hàng:', 56, custBoxY + 44);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
  ctx.fillText(customerInfo.name || 'Khách lẻ', 140, custBoxY + 44);

  ctx.fillStyle = '#64748b';
  ctx.font = 'normal 12px system-ui, -apple-system, sans-serif';
  ctx.fillText('Số điện thoại:', 430, custBoxY + 44);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
  ctx.fillText(customerInfo.phone || 'Chưa cập nhật', 525, custBoxY + 44);

  // Địa chỉ
  ctx.fillStyle = '#64748b';
  ctx.font = 'normal 12px system-ui, -apple-system, sans-serif';
  ctx.fillText('Địa chỉ:', 56, custBoxY + 65);
  ctx.fillStyle = '#1e293b';
  ctx.font = 'normal 12px system-ui, -apple-system, sans-serif';
  const displayAddress = customerInfo.address || 'Tại cửa hàng / Chưa có địa chỉ';
  ctx.fillText(displayAddress.length > 80 ? displayAddress.substring(0, 80) + '...' : displayAddress, 140, custBoxY + 65);

  if (customerInfo.note) {
    ctx.fillStyle = '#64748b';
    ctx.fillText('Ghi chú:', 56, custBoxY + 83);
    ctx.fillStyle = '#475569';
    ctx.font = 'italic 11px system-ui, -apple-system, sans-serif';
    ctx.fillText(customerInfo.note, 140, custBoxY + 83);
  }

  // 4. TABLE SẢN PHẨM
  // Thead Background
  ctx.fillStyle = '#0f172a';
  drawRoundedRect(ctx, 40, tableStartY, 720, 36, 6);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 10.5px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('STT', 60, tableStartY + 22);

  ctx.textAlign = 'left';
  ctx.fillText('TÊN HÀNG / SẢN PHẨM', 90, tableStartY + 22);

  ctx.textAlign = 'center';
  ctx.fillText('ẢNH', 395, tableStartY + 22);
  ctx.fillText('SL', 455, tableStartY + 22);

  ctx.textAlign = 'right';
  ctx.fillText('ĐƠN GIÁ', 580, tableStartY + 22);
  ctx.fillText('THÀNH TIỀN', 745, tableStartY + 22);

  // Tbody rows
  items.forEach((item, index) => {
    const rowY = tableStartY + 36 + index * rowHeight;

    // STT
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(String(item.stt), 60, rowY + 36);

    // Tên hàng & mã đơn
    ctx.textAlign = 'left';
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 12.5px system-ui, -apple-system, sans-serif';
    const cleanTitle = item.title.length > 32 ? item.title.substring(0, 32) + '...' : item.title;
    ctx.fillText(cleanTitle, 90, rowY + 24);

    ctx.fillStyle = '#059669';
    ctx.font = 'bold 10.5px monospace, monospace';
    ctx.fillText(`[${item.code}]`, 90, rowY + 42);

    if (item.note) {
      ctx.fillStyle = '#64748b';
      ctx.font = 'italic 10px system-ui, -apple-system, sans-serif';
      const cleanNote = item.note.length > 30 ? item.note.substring(0, 30) + '...' : item.note;
      ctx.fillText(`• ${cleanNote}`, 165, rowY + 42);
    }

    // Ảnh sản phẩm
    const imgX = 372;
    const imgY = rowY + 9;
    const imgSize = 46;

    if (item.image) {
      try {
        ctx.save();
        drawRoundedRect(ctx, imgX, imgY, imgSize, imgSize, 6);
        ctx.clip();
        ctx.drawImage(item.image, imgX, imgY, imgSize, imgSize);
        ctx.restore();
        ctx.strokeStyle = '#e2e8f0';
        drawRoundedRect(ctx, imgX, imgY, imgSize, imgSize, 6);
        ctx.stroke();
      } catch {
        // Fallback ô xám nếu ảnh lỗi
        ctx.fillStyle = '#f1f5f9';
        drawRoundedRect(ctx, imgX, imgY, imgSize, imgSize, 6);
        ctx.fill();
      }
    } else {
      ctx.fillStyle = '#f1f5f9';
      drawRoundedRect(ctx, imgX, imgY, imgSize, imgSize, 6);
      ctx.fill();
      ctx.strokeStyle = '#cbd5e1';
      ctx.stroke();
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'normal 9px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Không ảnh', imgX + 23, imgY + 27);
    }

    // Số lượng
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 12.5px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(String(item.qty), 455, rowY + 36);

    // Đơn giá
    ctx.fillStyle = '#334155';
    ctx.font = 'normal 12px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(formatVND(item.unitPrice), 580, rowY + 36);

    // Thành tiền
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 12.5px system-ui, -apple-system, sans-serif';
    ctx.fillText(formatVND(item.amount), 745, rowY + 36);

    // Border line dưới mỗi hàng
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, rowY + rowHeight);
    ctx.lineTo(760, rowY + rowHeight);
    ctx.stroke();
  });

  // 5. KHỐI THỐNG KÊ TỔNG QUAN
  const statBoxX = 440;
  const statBoxW = 320;

  ctx.fillStyle = '#f8fafc';
  drawRoundedRect(ctx, statBoxX, summaryBoxY, statBoxW, summaryBoxHeight, 10);
  ctx.fill();
  ctx.strokeStyle = '#e2e8f0';
  ctx.stroke();

  ctx.fillStyle = '#059669';
  ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('THỐNG KÊ TỔNG QUAN', statBoxX + 16, summaryBoxY + 22);

  // Dòng 1: Tổng số lượng
  ctx.fillStyle = '#475569';
  ctx.font = 'normal 12px system-ui, -apple-system, sans-serif';
  ctx.fillText('Tổng số lượng sản phẩm:', statBoxX + 16, summaryBoxY + 45);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`${totalQty} món`, statBoxX + statBoxW - 16, summaryBoxY + 45);

  // Dòng 2: Tổng tiền hàng
  ctx.fillStyle = '#475569';
  ctx.font = 'normal 12px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Tổng tiền hàng:', statBoxX + 16, summaryBoxY + 68);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(formatVND(totalAmount), statBoxX + statBoxW - 16, summaryBoxY + 68);

  // Dòng 3: Đã thanh toán
  ctx.fillStyle = '#059669';
  ctx.font = 'normal 12px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Đã thanh toán:', statBoxX + 16, summaryBoxY + 91);
  ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(formatVND(totalPaid), statBoxX + statBoxW - 16, summaryBoxY + 91);

  // Đường kẻ đứt
  ctx.strokeStyle = '#cbd5e1';
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(statBoxX + 16, summaryBoxY + 102);
  ctx.lineTo(statBoxX + statBoxW - 16, summaryBoxY + 102);
  ctx.stroke();
  ctx.setLineDash([]); // Reset nét đứt

  // Dòng 4: Còn nợ / Thu khi nhận
  ctx.fillStyle = '#e11d48';
  ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Còn nợ / Thu khi nhận:', statBoxX + 16, summaryBoxY + 122);
  ctx.textAlign = 'right';
  ctx.fillText(formatVND(totalRemaining), statBoxX + statBoxW - 16, summaryBoxY + 122);

  // 6. FOOTER CHỮ KÝ
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('KHÁCH HÀNG NHẬN', 200, footerY);
  ctx.fillText('NGƯỜI LẬP PHIẾU', 600, footerY);

  ctx.fillStyle = '#94a3b8';
  ctx.font = 'normal 10.5px system-ui, -apple-system, sans-serif';
  ctx.fillText('(Ký và ghi rõ họ tên)', 200, footerY + 16);
  ctx.fillText('(Ký và ghi rõ họ tên)', 600, footerY + 16);

  // Lời cảm ơn
  ctx.fillStyle = '#94a3b8';
  ctx.font = 'italic 11px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Cảm ơn quý khách đã tin tưởng và ủng hộ chúng tôi!', 400, footerY + 85);

  return canvas;
}

// XUẤT VÀ TẢI TRỰC TIẾP FILE PDF VỀ MÁY TÍNH
export async function exportOrdersPdf(options: ExportPdfOptions): Promise<void> {
  const { customerInfo, orders, fileName } = options;
  if (orders.length === 0) return;

  let canvas: HTMLCanvasElement;
  try {
    // Thử render có ảnh sản phẩm
    canvas = await renderReceiptToCanvas(options, true);
  } catch {
    // Nếu có lỗi do ảnh bảo mật (tainted), vẽ lại không có ảnh để luôn xuất được PDF thành công
    canvas = await renderReceiptToCanvas(options, false);
  }

  // Chuyển canvas sang ảnh PNG dataURL
  const imgData = canvas.toDataURL('image/png');

  // Khổ giấy chuẩn A4 (210mm x 297mm)
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pdfWidth = 210;
  const pdfHeight = 297;
  const imgWidth = pdfWidth;
  const imgHeight = (canvas.height * pdfWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  // Trang 1
  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
  heightLeft -= pdfHeight;

  // Nếu nhiều hơn 1 trang A4 thì tự thêm trang
  while (heightLeft > 0) {
    position -= pdfHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pdfHeight;
  }

  const now = new Date();
  const exportFileName =
    fileName ||
    `DonHang_${customerInfo.name ? customerInfo.name.replace(/\s+/g, '_') : 'Khach'}_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}.pdf`;

  // Tự động tải file PDF về máy tính của người dùng
  pdf.save(exportFileName);
}

// In phiếu trực tiếp bằng hộp thoại in của trình duyệt (nếu người dùng chủ động bấm In)
export async function printOrders(options: ExportPdfOptions): Promise<void> {
  const { customerInfo, orders, systemTitle = 'HỆ THỐNG QUẢN LÝ ĐƠN HÀNG 2H' } = options;
  if (orders.length === 0) return;

  let totalQty = 0;
  let totalAmount = 0;
  let totalPaid = 0;

  const rows = orders.map((o, idx) => {
    const cust = o.customers?.[0];
    const qty = cust?.quantity || 1;
    const amount = Number(o.totalAmount) || 0;
    const paid = Number(o.paidAmount) || 0;
    const unitPrice = qty > 0 ? Math.round(amount / qty) : amount;

    totalQty += qty;
    totalAmount += amount;
    totalPaid += paid;

    return `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 10px 8px; text-align: center; color: #64748b;">${idx + 1}</td>
        <td style="padding: 10px 10px;">
          <div style="font-weight: bold; color: #0f172a;">${o.title}</div>
          <div style="font-family: monospace; color: #059669; font-size: 11px;">[${o.orderCode}]</div>
        </td>
        <td style="padding: 6px 8px; text-align: center;">
          ${o.imageUrl ? `<img src="${o.imageUrl}" style="width: 44px; height: 44px; object-fit: cover; border-radius: 6px;" />` : '-'}
        </td>
        <td style="padding: 10px 8px; text-align: center; font-weight: bold;">${qty}</td>
        <td style="padding: 10px 10px; text-align: right;">${formatVND(unitPrice)}</td>
        <td style="padding: 10px 10px; text-align: right; font-weight: bold;">${formatVND(amount)}</td>
      </tr>
    `;
  }).join('');

  const totalRemaining = Math.max(0, totalAmount - totalPaid);

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.left = '-99999px';
  iframe.style.top = '0';
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) return;

  iframeDoc.open();
  iframeDoc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>In Phiếu Đơn Hàng</title>
        <style>
          @page { size: A4 portrait; margin: 12mm 15mm; }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: system-ui, -apple-system, sans-serif; color: #0f172a; padding: 10px; }
        </style>
      </head>
      <body>
        <div style="border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px;">
          <div style="font-size: 12px; font-weight: bold; color: #059669;">${systemTitle}</div>
          <div style="font-size: 20px; font-weight: bold;">PHIẾU GIAO HÀNG / BẢNG KÊ ĐƠN HÀNG</div>
        </div>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 16px; font-size: 12px;">
          <div><strong>Khách hàng:</strong> ${customerInfo.name || 'Khách lẻ'} - <strong>SĐT:</strong> ${customerInfo.phone || 'Chưa có'}</div>
          <div style="margin-top: 4px;"><strong>Địa chỉ:</strong> ${customerInfo.address || 'Tại cửa hàng'}</div>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <tr style="background: #0f172a; color: white;">
            <th style="padding: 8px;">STT</th>
            <th style="padding: 8px; text-align: left;">Tên hàng</th>
            <th style="padding: 8px;">Ảnh</th>
            <th style="padding: 8px;">SL</th>
            <th style="padding: 8px; text-align: right;">Đơn giá</th>
            <th style="padding: 8px; text-align: right;">Thành tiền</th>
          </tr>
          ${rows}
        </table>
        <div style="margin-top: 16px; text-align: right; font-size: 12px;">
          <div>Tổng số lượng: <strong>${totalQty} món</strong></div>
          <div>Tổng tiền: <strong>${formatVND(totalAmount)}</strong></div>
          <div style="color: #059669;">Đã thu: <strong>${formatVND(totalPaid)}</strong></div>
          <div style="color: #e11d48; font-weight: bold; font-size: 13px;">Còn nợ: ${formatVND(totalRemaining)}</div>
        </div>
      </body>
    </html>
  `);
  iframeDoc.close();

  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => {
      if (document.body.contains(iframe)) document.body.removeChild(iframe);
    }, 2000);
  }, 200);
}
