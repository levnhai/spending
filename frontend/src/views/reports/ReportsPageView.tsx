'use client';

import React, { useState } from 'react';
import { Header } from '@/widgets/header/Header';
import { FileSpreadsheet, Download, FileText } from 'lucide-react';
import { api } from '@/shared/lib/api';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { AddTransactionModal } from '@/features/add-transaction/AddTransactionModal';

export const ReportsPageView: React.FC = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  const fetchExportData = async () => {
    const res = await api.get('/reports/export', { params: { startDate, endDate } });
    return res.data;
  };

  const handleExportExcel = async () => {
    setLoading(true);
    try {
      const data = await fetchExportData();
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'GiaoDich');
      XLSX.writeFile(workbook, `FinFlow_BaoCao_GiaoDich_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (e) {
      alert('Xuất Excel thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    setLoading(true);
    try {
      const data = await fetchExportData();
      const worksheet = XLSX.utils.json_to_sheet(data);
      const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
      const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `FinFlow_BaoCao_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      alert('Xuất CSV thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    setLoading(true);
    try {
      const data = await fetchExportData();
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text('BAO CAO GIAO DICH TAICHINH - FINFLOW', 14, 20);
      doc.setFontSize(10);
      doc.text(`Ngay xuat: ${new Date().toLocaleDateString('vi-VN')}`, 14, 28);

      let y = 40;
      data.slice(0, 30).forEach((item: any, idx: number) => {
        doc.text(`${idx + 1}. [${item.Date}] ${item.Type} - ${item.Amount} VND - ${item.Category || item.Note}`, 14, y);
        y += 8;
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
      });

      doc.save(`FinFlow_BaoCao_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (e) {
      alert('Xuất PDF thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-20 md:pb-8 space-y-6">
      <Header title="Báo Cáo & Xuất Nhập Dữ Liệu" onOpenQuickAdd={() => setIsQuickAddOpen(true)} />

      <main className="px-4 md:px-8 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Xuất Báo Cáo Tài Chính</h2>
          <p className="text-xs text-slate-400">Xuất file Excel, CSV, PDF và nhập sao lưu dữ liệu</p>
        </div>

        {/* Date Filter Card */}
        <div className="p-6 rounded-3xl glass-card border border-slate-200/80 dark:border-slate-800/80 space-y-4">
          <h3 className="font-bold text-base text-slate-900 dark:text-white">Chọn Khoảng Thời Gian</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Từ Ngày</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Đến Ngày</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Action Export Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Excel */}
          <div className="p-6 rounded-3xl glass-card border border-slate-200/80 dark:border-slate-800/80 space-y-4 hover:shadow-xl transition-all">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white">Báo Cáo Excel (.xlsx)</h4>
              <p className="text-xs text-slate-400 mt-1">Xuất danh sách tất cả giao dịch ra bảng tính Excel chuẩn.</p>
            </div>
            <button
              onClick={handleExportExcel}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-emerald-500 text-white font-semibold text-xs shadow-md flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>{loading ? 'Đang xuất...' : 'Tải File Excel'}</span>
            </button>
          </div>

          {/* CSV */}
          <div className="p-6 rounded-3xl glass-card border border-slate-200/80 dark:border-slate-800/80 space-y-4 hover:shadow-xl transition-all">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white">Báo Cáo CSV (.csv)</h4>
              <p className="text-xs text-slate-400 mt-1">Phù hợp cho việc lưu trữ văn bản và xử lý dữ liệu.</p>
            </div>
            <button
              onClick={handleExportCSV}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-indigo-500 text-white font-semibold text-xs shadow-md flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>{loading ? 'Đang xuất...' : 'Tải File CSV'}</span>
            </button>
          </div>

          {/* PDF */}
          <div className="p-6 rounded-3xl glass-card border border-slate-200/80 dark:border-slate-800/80 space-y-4 hover:shadow-xl transition-all">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white">Báo Cáo PDF (.pdf)</h4>
              <p className="text-xs text-slate-400 mt-1">In ấn hoặc chia sẻ tài liệu báo cáo giao dịch định dạng PDF.</p>
            </div>
            <button
              onClick={handleExportPDF}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-rose-500 text-white font-semibold text-xs shadow-md flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>{loading ? 'Đang xuất...' : 'Tải File PDF'}</span>
            </button>
          </div>
        </div>
      </main>

      <AddTransactionModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onSuccess={() => {}}
      />
    </div>
  );
};
