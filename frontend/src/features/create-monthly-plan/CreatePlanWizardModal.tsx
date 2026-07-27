import React, { useState, useEffect } from 'react';
import { X, ArrowRight, ArrowLeft, Check, Plus, Trash2, Sparkles, DollarSign, ShieldCheck, Wallet, Calculator } from 'lucide-react';
import { monthlyPlanApi, MonthlyPlan, FixedExpenseItem, DebtRepaymentItem, SavingsTargetItem } from '@/entities/monthly-plan/monthlyPlanApi';
import { formatNumberWithSpaces, parseFormattedNumber } from '@/shared/lib/formatters';
import { AmountDisplay } from '@/shared/ui/AmountDisplay';

interface CreatePlanWizardModalProps {
  isOpen: boolean;
  month: number;
  year: number;
  initialPlan?: MonthlyPlan;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreatePlanWizardModal: React.FC<CreatePlanWizardModalProps> = ({
  isOpen,
  month,
  year,
  initialPlan,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState(1);
  const [expectedIncome, setExpectedIncome] = useState('');
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpenseItem[]>([]);
  const [debtRepayments, setDebtRepayments] = useState<DebtRepaymentItem[]>([]);
  const [savingsTargets, setSavingsTargets] = useState<SavingsTargetItem[]>([]);
  const [notes, setNotes] = useState('');

  // Item form states
  const [newFixedName, setNewFixedName] = useState('');
  const [newFixedAmount, setNewFixedAmount] = useState('');

  const [newDebtName, setNewDebtName] = useState('');
  const [newDebtAmount, setNewDebtAmount] = useState('');

  const [newSavingsName, setNewSavingsName] = useState('');
  const [newSavingsAmount, setNewSavingsAmount] = useState('');

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      if (initialPlan) {
        setExpectedIncome(formatNumberWithSpaces(initialPlan.expectedIncome));
        setFixedExpenses(initialPlan.fixedExpenses || []);
        setDebtRepayments(initialPlan.debtRepayments || []);
        setSavingsTargets(initialPlan.savingsTargets || []);
        setNotes(initialPlan.notes || '');
      } else {
        setExpectedIncome('');
        setFixedExpenses([]);
        setDebtRepayments([]);
        setSavingsTargets([]);
        setNotes('');
      }
    }
  }, [isOpen, initialPlan]);

  if (!isOpen) return null;

  // Auto-fetch suggestions from Recurring Bills, Debts, Savings Goals
  const handleAutoSuggest = async () => {
    try {
      setLoading(true);
      const suggestions = await monthlyPlanApi.getSuggestions();

      if (suggestions.suggestedBills.length > 0) {
        setFixedExpenses(
          suggestions.suggestedBills.map((b) => ({
            name: b.name,
            amount: b.amount,
            billId: b.billId,
          }))
        );
      }

      if (suggestions.suggestedDebts.length > 0) {
        setDebtRepayments(
          suggestions.suggestedDebts.map((d) => ({
            name: d.name,
            amount: d.amount,
            debtId: d.debtId,
          }))
        );
      }

      if (suggestions.suggestedSavings.length > 0) {
        setSavingsTargets(
          suggestions.suggestedSavings.map((s) => ({
            name: s.name,
            amount: s.amount,
            goalId: s.goalId,
          }))
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Add Item Handlers
  const handleAddFixed = () => {
    const amt = parseFormattedNumber(newFixedAmount);
    if (!newFixedName.trim() || amt <= 0) return alert('Vui lòng nhập tên và số tiền hợp lệ');
    setFixedExpenses([...fixedExpenses, { name: newFixedName.trim(), amount: amt }]);
    setNewFixedName('');
    setNewFixedAmount('');
  };

  const handleAddDebt = () => {
    const amt = parseFormattedNumber(newDebtAmount);
    if (!newDebtName.trim() || amt <= 0) return alert('Vui lòng nhập tên và số tiền hợp lệ');
    setDebtRepayments([...debtRepayments, { name: newDebtName.trim(), amount: amt }]);
    setNewDebtName('');
    setNewDebtAmount('');
  };

  const handleAddSavings = () => {
    const amt = parseFormattedNumber(newSavingsAmount);
    if (!newSavingsName.trim() || amt <= 0) return alert('Vui lòng nhập tên và số tiền hợp lệ');
    setSavingsTargets([...savingsTargets, { name: newSavingsName.trim(), amount: amt }]);
    setNewSavingsName('');
    setNewSavingsAmount('');
  };

  // Calculations
  const incomeNum = parseFormattedNumber(expectedIncome);
  const totalFixed = fixedExpenses.reduce((s, i) => s + i.amount, 0);
  const totalDebt = debtRepayments.reduce((s, i) => s + i.amount, 0);
  const totalSavings = savingsTargets.reduce((s, i) => s + i.amount, 0);
  const discretionaryBudget = Math.max(0, incomeNum - totalFixed - totalDebt - totalSavings);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await monthlyPlanApi.savePlan({
        month,
        year,
        expectedIncome: incomeNum,
        fixedExpenses,
        debtRepayments,
        savingsTargets,
        categoryLimits: [],
        notes: notes.trim() || undefined,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi lưu kế hoạch');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calculator className="w-5 h-5 text-indigo-500" />
              Lập Kế Hoạch Chi Tiêu Tháng {month}/{year}
            </h3>
            <p className="text-xs text-slate-400">
              Bước {step}/4: {step === 1 ? 'Thu nhập dự kiến' : step === 2 ? 'Chi phí cố định' : step === 3 ? 'Trả nợ & Tiết kiệm' : 'Tổng quan & Lưu'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Steps Bar */}
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all ${
                s <= step ? 'bg-indigo-600' : 'bg-slate-100 dark:bg-slate-800'
              }`}
            />
          ))}
        </div>

        {/* STEP 1: EXPECTED INCOME */}
        {step === 1 && (
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-900 dark:text-indigo-200 text-xs">
              💡 Nhập tổng thu nhập dự kiến trong tháng (Lương, thưởng, thu nhập phụ, kinh doanh...) để làm cơ sở phân bổ ngân sách.
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                Tổng Thu Nhập Dự Kiến Tháng (VNĐ) *
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={expectedIncome}
                onChange={(e) => setExpectedIncome(formatNumberWithSpaces(e.target.value))}
                placeholder="VD: 25 000 000"
                required
                className="w-full text-2xl font-bold px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        )}

        {/* STEP 2: FIXED EXPENSES */}
        {step === 2 && (
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Chi Phí Cố Định Hàng Tháng (Tiền nhà, điện nước, internet...)
              </span>
              <button
                type="button"
                onClick={handleAutoSuggest}
                className="px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-semibold text-xs flex items-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Gợi ý tự động
              </button>
            </div>

            {/* Input Add Fixed */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
              <input
                type="text"
                value={newFixedName}
                onChange={(e) => setNewFixedName(e.target.value)}
                placeholder="Tên khoản (VD: Tiền nhà)"
                className="sm:col-span-2 px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none"
              />
              <input
                type="text"
                inputMode="numeric"
                value={newFixedAmount}
                onChange={(e) => setNewFixedAmount(formatNumberWithSpaces(e.target.value))}
                placeholder="Số tiền (VD: 5 000 000)"
                className="sm:col-span-2 px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddFixed}
                className="px-3 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-md"
              >
                <Plus className="w-4 h-4" />
                Thêm
              </button>
            </div>

            {/* Fixed List */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {fixedExpenses.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs"
                >
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{item.name}</span>
                  <div className="flex items-center gap-3">
                    <AmountDisplay amount={item.amount} className="font-bold text-slate-900 dark:text-white" />
                    <button
                      type="button"
                      onClick={() => setFixedExpenses(fixedExpenses.filter((_, i) => i !== idx))}
                      className="text-slate-400 hover:text-rose-500 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {fixedExpenses.length === 0 && (
                <p className="text-xs text-slate-400 italic text-center py-4">
                  Chưa có chi phí cố định nào. Bấm "Gợi ý tự động" hoặc thêm thủ công.
                </p>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span>Tổng chi phí cố định:</span>
              <AmountDisplay amount={totalFixed} className="text-slate-900 dark:text-white" />
            </div>
          </div>
        )}

        {/* STEP 3: DEBT & SAVINGS ALLOCATIONS */}
        {step === 3 && (
          <div className="space-y-6 py-2">
            {/* Debt Repayments */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 block">
                1. Trả Nợ Hàng Tháng (Khoản vay, tín dụng...)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                <input
                  type="text"
                  value={newDebtName}
                  onChange={(e) => setNewDebtName(e.target.value)}
                  placeholder="Tên khoản nợ (VD: Trả vay Vietcombank)"
                  className="sm:col-span-2 px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none"
                />
                <input
                  type="text"
                  inputMode="numeric"
                  value={newDebtAmount}
                  onChange={(e) => setNewDebtAmount(formatNumberWithSpaces(e.target.value))}
                  placeholder="Số tiền (VD: 2 000 000)"
                  className="sm:col-span-2 px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddDebt}
                  className="px-3 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  Thêm
                </button>
              </div>

              <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                {debtRepayments.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs"
                  >
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{item.name}</span>
                    <div className="flex items-center gap-3">
                      <AmountDisplay amount={item.amount} className="font-bold text-amber-600 dark:text-amber-400" />
                      <button
                        type="button"
                        onClick={() => setDebtRepayments(debtRepayments.filter((_, i) => i !== idx))}
                        className="text-slate-400 hover:text-rose-500 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Savings Targets */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 block">
                2. Tích Lũy Tiết Kiệm (Trích tiền đầu tháng)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                <input
                  type="text"
                  value={newSavingsName}
                  onChange={(e) => setNewSavingsName(e.target.value)}
                  placeholder="Tên mục tiêu (VD: Tiết kiệm mua xe)"
                  className="sm:col-span-2 px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none"
                />
                <input
                  type="text"
                  inputMode="numeric"
                  value={newSavingsAmount}
                  onChange={(e) => setNewSavingsAmount(formatNumberWithSpaces(e.target.value))}
                  placeholder="Số tiền (VD: 3 000 000)"
                  className="sm:col-span-2 px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddSavings}
                  className="px-3 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  Thêm
                </button>
              </div>

              <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                {savingsTargets.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs"
                  >
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{item.name}</span>
                    <div className="flex items-center gap-3">
                      <AmountDisplay amount={item.amount} className="font-bold text-indigo-600 dark:text-indigo-400" />
                      <button
                        type="button"
                        onClick={() => setSavingsTargets(savingsTargets.filter((_, i) => i !== idx))}
                        className="text-slate-400 hover:text-rose-500 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: SUMMARY & REVIEW */}
        {step === 4 && (
          <div className="space-y-4 py-2">
            <div className="p-6 rounded-3xl bg-slate-900 text-white space-y-4 border border-indigo-500/30">
              <span className="text-xs text-indigo-300 font-bold uppercase tracking-wider block">
                Tổng Quan Bản Kế Hoạch Chi Tiêu
              </span>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span>1. Thu nhập dự kiến:</span>
                  <AmountDisplay amount={incomeNum} className="font-bold text-emerald-400" />
                </div>
                <div className="flex justify-between">
                  <span>2. Chi phí cố định (-):</span>
                  <AmountDisplay amount={totalFixed} className="font-bold text-slate-300" />
                </div>
                <div className="flex justify-between">
                  <span>3. Trả nợ hàng tháng (-):</span>
                  <AmountDisplay amount={totalDebt} className="font-bold text-amber-400" />
                </div>
                <div className="flex justify-between">
                  <span>4. Tiết kiệm (-):</span>
                  <AmountDisplay amount={totalSavings} className="font-bold text-indigo-400" />
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex justify-between items-baseline">
                <span className="text-xs font-semibold text-indigo-200">Ngân sách chi tiêu tự do còn lại:</span>
                <AmountDisplay amount={discretionaryBudget} className="text-2xl font-extrabold text-emerald-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Ghi Chú Kế Hoạch
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="VD: Cố gắng duy trì tiết kiệm mua xe, hạn chế ăn ngoài..."
                className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Wizard Controls Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại
            </button>
          ) : <div />}

          {step < 4 ? (
            <button
              type="button"
              onClick={() => {
                if (step === 1 && incomeNum <= 0) return alert('Vui lòng nhập thu nhập dự kiến lớn hơn 0');
                setStep(step + 1);
              }}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-500/20"
            >
              Tiếp theo
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={handleSubmit}
              className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
            >
              <Check className="w-4 h-4" />
              {loading ? 'Đang lưu...' : 'Lưu Bản Kế Hoạch'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
