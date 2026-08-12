import React from 'react';
import { Calendar, AlertTriangle, CheckCircle2, TrendingUp, TrendingDown, DollarSign, Wallet, ShieldCheck, Flame } from 'lucide-react';
import { PlanSummaryData } from '../monthlyPlanApi';
import { AmountDisplay } from '@/shared/ui/AmountDisplay';

interface MonthlyPlanSummaryCardProps {
  data: PlanSummaryData;
  onEditClick: () => void;
}

export const MonthlyPlanSummaryCard: React.FC<MonthlyPlanSummaryCardProps> = ({ data, onEditClick }) => {
  if (!data.hasPlan || !data.summary) {
    return (
      <div className="p-8 rounded-3xl glass-card border border-dashed border-slate-300 dark:border-slate-800 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mx-auto">
          <Calendar className="w-8 h-8" />
        </div>
        <div className="max-w-md mx-auto space-y-1">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Chưa có Kế Hoạch Chi Tiêu Tháng {data.month}/{data.year}
          </h3>
          <p className="text-xs text-slate-400">
            Lập bản kế hoạch ngay để tự động trừ chi phí cố định, nợ & tiết kiệm, từ đó kiểm soát hạn mức chi tiêu hàng ngày một cách khoa học.
          </p>
        </div>
        <button
          onClick={onEditClick}
          className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-500/20 transition-all"
        >
          Lập Kế Hoạch Ngay
        </button>
      </div>
    );
  }

  const { summary, month, year, totalDays = 30, currentDay = 1 } = data;

  const remainingDays = summary.remainingDays ?? Math.max(1, totalDays - currentDay + 1);
  const adjustedDailyAllowance = summary.adjustedDailyAllowance ?? (
    summary.remainingDiscretionary > 0
      ? Math.round(summary.remainingDiscretionary / remainingDays)
      : 0
  );

  return (
    <div className="space-y-6">
      {/* HERO BANNER - DISCRETIONARY BUDGET */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-2xl relative overflow-hidden border border-indigo-500/20 space-y-6">
        {/* Background glow effects */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-1">
              <Calendar className="w-4 h-4" />
              <span>Bản Kế Hoạch Chi Tiêu Tháng {month}/{year}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Ngân Sách Chi Tiêu Tự Do
            </h2>
          </div>

          <button
            onClick={onEditClick}
            className="px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold shadow-lg shadow-indigo-500/30 transition-all flex items-center gap-1.5"
          >
            <span>Bổ Sung & Chỉnh Sửa Kế Hoạch</span>
          </button>
        </div>

        {/* Big Amount */}
        <div className="relative z-10 pt-2 border-t border-white/10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs text-indigo-200 block mb-1">Còn lại cho chi tiêu linh hoạt</span>
            <AmountDisplay
              amount={summary.remainingDiscretionary}
              className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${
                summary.remainingDiscretionary >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            />
          </div>

          <div className="text-left sm:text-right text-xs text-indigo-200 space-y-0.5">
            <div>Ngân sách ban đầu: <AmountDisplay amount={summary.discretionaryBudget} className="font-bold text-white" /></div>
            <div>Đã chi tiêu thực tế: <AmountDisplay amount={summary.actualExpense} className="font-bold text-amber-400" /></div>
          </div>
        </div>

        {/* Daily Allowance Comparison Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 relative z-10">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-indigo-200 font-medium block">Hạn mức ban đầu mỗi ngày</span>
              <span className="text-[10px] font-bold text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-md">Đề xuất ban đầu</span>
            </div>
            <AmountDisplay amount={summary.dailyAllowance} className="text-xl font-bold text-white" />
            <span className="text-[11px] text-indigo-300/80 block">= Ngân sách ban đầu / {totalDays} ngày</span>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-amber-200 font-medium block">Hạn mức điều chỉnh ({remainingDays} ngày còn lại)</span>
              <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-md">Thực tế điều chỉnh</span>
            </div>
            {summary.remainingDiscretionary > 0 ? (
              <AmountDisplay amount={adjustedDailyAllowance} className="text-xl font-bold text-amber-300" />
            ) : (
              <span className="text-xl font-bold text-rose-400 block">0đ (Đã hết hạn mức)</span>
            )}
            <span className="text-[11px] text-amber-200/80 block">
              {summary.remainingDiscretionary > 0
                ? `= Tiền còn lại / ${remainingDays} ngày còn lại`
                : 'Đã chi tiêu quá ngân sách ban đầu!'}
            </span>
          </div>
        </div>

        {/* Spending Pace Progress */}
        <div className="space-y-2 pt-2 border-t border-white/10 relative z-10">
          <div className="flex items-center justify-between text-xs">
            <span className="text-indigo-200 font-medium flex items-center gap-1.5">
              <Flame className={`w-4 h-4 ${summary.isOverPace ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`} />
              Tốc độ chi tiêu ({currentDay}/{totalDays} ngày - {summary.daysPassedPercentage}% thời gian)
            </span>
            <span className={`font-bold ${summary.isOverPace ? 'text-rose-400' : 'text-emerald-400'}`}>
              Đã tiêu {summary.spentPercentage}% ngân sách
            </span>
          </div>

          <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                summary.isOverPace ? 'bg-gradient-to-r from-amber-500 to-rose-500' : 'bg-gradient-to-r from-emerald-500 to-indigo-500'
              }`}
              style={{ width: `${Math.min(100, summary.spentPercentage)}%` }}
            />
          </div>

          {/* Over-Pace / Over-Budget Recommendation Advice */}
          {(summary.isOverPace || summary.remainingDiscretionary <= 0) && (
            <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-100 space-y-3 mt-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <span className="font-bold text-xs sm:text-sm flex items-center gap-2 text-amber-300">
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0" />
                  Đề Xuất Điều Chỉnh Chi Tiêu ({remainingDays} Ngày Còn Lại)
                </span>
                <button
                  onClick={onEditClick}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center gap-1 shrink-0"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Bổ Sung Ngân Sách</span>
                </button>
              </div>
              <p className="text-xs text-amber-200/90 leading-relaxed">
                {summary.remainingDiscretionary <= 0 ? (
                  <>
                    🔴 Bạn đã tiêu vượt ngân sách tự do <b><AmountDisplay amount={Math.abs(summary.remainingDiscretionary)} showEye={false} className="text-rose-400 font-bold" /></b>! Hãy bấm nút <b>"Bổ Sung Ngân Sách"</b> để tăng thêm thu nhập dự kiến hoặc thắt chặt chi phí cố định/tiết kiệm.
                  </>
                ) : (
                  <>
                    📌 Đề xuất ban đầu là <b><AmountDisplay amount={summary.dailyAllowance} showEye={false} className="font-bold text-white" />/ngày</b>. Do đã chi tiêu hết <b>{summary.spentPercentage}% ngân sách</b> (trải qua {summary.daysPassedPercentage}% thời gian), trong <b>{remainingDays} ngày còn lại</b> bạn chỉ được tiêu tối đa <b><AmountDisplay amount={adjustedDailyAllowance} showEye={false} className="text-amber-300 font-bold" />/ngày</b> để không bị vỡ kế hoạch tài chính!
                  </>
                )}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* DEDUCTION BREAKDOWN CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Expected Income */}
        <div className="p-5 rounded-3xl glass-card border border-slate-200/80 dark:border-slate-800/80 space-y-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">1. Thu Nhập Dự Kiến</span>
          <AmountDisplay amount={summary.expectedIncome} className="text-2xl font-bold text-emerald-600 dark:text-emerald-400" />
          <p className="text-[11px] text-slate-400">Thực tế đã thu: <AmountDisplay amount={summary.actualIncome} className="font-semibold text-slate-700 dark:text-slate-300" /></p>
        </div>

        {/* Fixed Expenses */}
        <div className="p-5 rounded-3xl glass-card border border-slate-200/80 dark:border-slate-800/80 space-y-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">2. Chi Phí Cố Định (-)</span>
          <AmountDisplay amount={summary.totalFixed} className="text-2xl font-bold text-slate-900 dark:text-white" />
          <p className="text-[11px] text-slate-400">{data.plan?.fixedExpenses?.length || 0} khoản hóa đơn</p>
        </div>

        {/* Debt Repayments */}
        <div className="p-5 rounded-3xl glass-card border border-slate-200/80 dark:border-slate-800/80 space-y-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">3. Trả Nợ Hàng Tháng (-)</span>
          <AmountDisplay amount={summary.totalDebt} className="text-2xl font-bold text-amber-600 dark:text-amber-400" />
          <p className="text-[11px] text-slate-400">{data.plan?.debtRepayments?.length || 0} nghĩa vụ trả nợ</p>
        </div>

        {/* Savings Targets */}
        <div className="p-5 rounded-3xl glass-card border border-slate-200/80 dark:border-slate-800/80 space-y-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">4. Tích Lũy Tiết Kiệm (-)</span>
          <AmountDisplay amount={summary.totalSavings} className="text-2xl font-bold text-indigo-600 dark:text-indigo-400" />
          <p className="text-[11px] text-slate-400">{data.plan?.savingsTargets?.length || 0} mục tiêu tích lũy</p>
        </div>
      </div>
    </div>
  );
};
