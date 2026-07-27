'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/widgets/header/Header';
import { monthlyPlanApi, PlanSummaryData } from '@/entities/monthly-plan/monthlyPlanApi';
import { MonthlyPlanSummaryCard } from '@/entities/monthly-plan/ui/MonthlyPlanSummaryCard';
import { CreatePlanWizardModal } from '@/features/create-monthly-plan/CreatePlanWizardModal';
import { AddTransactionModal } from '@/features/add-transaction/AddTransactionModal';
import { AmountDisplay } from '@/shared/ui/AmountDisplay';
import { Calendar, Plus, Trash2, Edit3, ShieldAlert, Sparkles, CheckCircle } from 'lucide-react';

export const MonthlyPlanPageView: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const [planData, setPlanData] = useState<PlanSummaryData | null>(null);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchPlan = async () => {
    try {
      setLoading(true);
      const data = await monthlyPlanApi.getPlan(selectedMonth, selectedYear);
      setPlanData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlan();
  }, [selectedMonth, selectedYear]);

  const handleDeletePlan = async () => {
    if (confirm(`Bạn có chắc chắn muốn xóa bản kế hoạch tháng ${selectedMonth}/${selectedYear}?`)) {
      try {
        await monthlyPlanApi.deletePlan(selectedMonth, selectedYear);
        fetchPlan();
      } catch (e) {
        alert('Xóa kế hoạch thất bại');
      }
    }
  };

  return (
    <div className="min-h-screen pb-20 md:pb-8 space-y-6">
      <Header title="Bản Kế Hoạch Chi Tiêu Tháng" onOpenQuickAdd={() => setIsQuickAddOpen(true)} />

      <main className="px-4 md:px-8 space-y-6">
        {/* HEADER CONTROLS */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Kế Hoạch Quản Trị Tài Chính Tháng
            </h2>
            <p className="text-xs text-slate-400">
              Khấu trừ chi phí cố định, trả nợ & tiết kiệm để kiểm soát hạn mức chi tiêu hàng ngày
            </p>
          </div>

          {/* Month Year Selector */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-transparent text-xs font-bold px-3 py-1.5 text-slate-900 dark:text-white focus:outline-none cursor-pointer"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white py-1">
                    Tháng {m}
                  </option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-transparent text-xs font-bold px-3 py-1.5 text-slate-900 dark:text-white focus:outline-none cursor-pointer"
              >
                {[2025, 2026, 2027].map((y) => (
                  <option key={y} value={y} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white py-1">
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {planData?.hasPlan ? (
              <button
                onClick={() => setIsWizardOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20"
              >
                <Edit3 className="w-4 h-4" />
                <span>Sửa Kế Hoạch</span>
              </button>
            ) : (
              <button
                onClick={() => setIsWizardOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>Lập Kế Hoạch</span>
              </button>
            )}
          </div>
        </div>

        {/* SUMMARY HERO CARD */}
        {planData && (
          <MonthlyPlanSummaryCard
            data={planData}
            onEditClick={() => setIsWizardOpen(true)}
          />
        )}

        {/* DETAILS BREAKDOWN SECTIONS */}
        {planData?.hasPlan && planData.plan && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Fixed Expenses List */}
            <div className="p-6 rounded-3xl glass-card border border-slate-200/80 dark:border-slate-800/80 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                  Chi Phí Cố Định ({planData.plan.fixedExpenses.length})
                </h3>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {planData.plan.fixedExpenses.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-xs"
                  >
                    <span className="font-medium text-slate-700 dark:text-slate-300">{item.name}</span>
                    <AmountDisplay amount={item.amount} className="font-bold text-slate-900 dark:text-white" />
                  </div>
                ))}
              </div>
            </div>

            {/* Debt Repayments List */}
            <div className="p-6 rounded-3xl glass-card border border-slate-200/80 dark:border-slate-800/80 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  Nghĩa Vụ Trả Nợ ({planData.plan.debtRepayments.length})
                </h3>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {planData.plan.debtRepayments.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center p-3 rounded-2xl bg-amber-500/10 text-xs"
                  >
                    <span className="font-medium text-slate-800 dark:text-slate-200">{item.name}</span>
                    <AmountDisplay amount={item.amount} className="font-bold text-amber-600 dark:text-amber-400" />
                  </div>
                ))}
              </div>
            </div>

            {/* Savings Targets List */}
            <div className="p-6 rounded-3xl glass-card border border-slate-200/80 dark:border-slate-800/80 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                  Tích Lũy Tiết Kiệm ({planData.plan.savingsTargets.length})
                </h3>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {planData.plan.savingsTargets.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center p-3 rounded-2xl bg-indigo-500/10 text-xs"
                  >
                    <span className="font-medium text-slate-800 dark:text-slate-200">{item.name}</span>
                    <AmountDisplay amount={item.amount} className="font-bold text-indigo-600 dark:text-indigo-400" />
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="col-span-full flex justify-end pt-2">
              <button
                onClick={handleDeletePlan}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-rose-500 hover:bg-rose-500/10 font-semibold text-xs transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Xóa Bản Kế Hoạch Tháng Này</span>
              </button>
            </div>
          </div>
        )}

        {/* WIZARD MODAL */}
        <CreatePlanWizardModal
          isOpen={isWizardOpen}
          month={selectedMonth}
          year={selectedYear}
          initialPlan={planData?.plan}
          onClose={() => setIsWizardOpen(false)}
          onSuccess={fetchPlan}
        />

        {/* QUICK ADD TRANSACTION MODAL */}
        <AddTransactionModal
          isOpen={isQuickAddOpen}
          onClose={() => setIsQuickAddOpen(false)}
          onSuccess={fetchPlan}
        />
      </main>
    </div>
  );
};
