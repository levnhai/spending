'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/widgets/header/Header';
import { categoryApi, Category } from '@/entities/category/categoryApi';
import {
  Plus,
  Pencil,
  Trash2,
  Tag,
  Utensils,
  ShoppingBag,
  Car,
  Home,
  Film,
  HeartPulse,
  GraduationCap,
  DollarSign,
  Gift,
  Briefcase,
  Zap,
  Smartphone,
  Coffee,
  Plane,
  Gamepad2,
  Wrench,
  Bus,
  BookOpen,
  Smile,
  ShieldAlert,
  Sparkles,
  Music,
  Baby,
  X,
  Check,
  Lock,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  Tag,
  Utensils,
  ShoppingBag,
  Car,
  Home,
  Film,
  HeartPulse,
  GraduationCap,
  DollarSign,
  Gift,
  Briefcase,
  Zap,
  Smartphone,
  Coffee,
  Plane,
  Gamepad2,
  Wrench,
  Bus,
  BookOpen,
  Smile,
  ShieldAlert,
  Sparkles,
  Music,
  Baby,
};

const COLOR_PRESETS = [
  '#F43F5E', // Rose
  '#10B981', // Emerald
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#F59E0B', // Amber
  '#06B6D4', // Cyan
  '#14B8A6', // Teal
  '#6366F1', // Indigo
  '#A855F7', // Violet
  '#EF4444', // Red
  '#84CC16', // Lime
];

function CategoryIcon({ iconName, className = 'w-5 h-5' }: { iconName?: string; className?: string }) {
  const IconComponent = (iconName && ICON_MAP[iconName]) ? ICON_MAP[iconName] : Tag;
  return <IconComponent className={className} />;
}

export const CategoriesPageView: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'expense' | 'income'>('all');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [color, setColor] = useState('#10B981');
  const [icon, setIcon] = useState('Tag');
  const [submitting, setSubmitting] = useState(false);

  // Delete State
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await categoryApi.getAll();
      setCategories(data);
    } catch (err) {
      console.error('Lỗi lấy danh sách danh mục:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setName('');
    setType(activeTab === 'income' ? 'income' : 'expense');
    setColor('#10B981');
    setIcon('Tag');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setType(cat.type);
    setColor(cat.color || '#10B981');
    setIcon(cat.icon || 'Tag');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Vui lòng nhập tên danh mục');
      return;
    }

    setSubmitting(true);
    try {
      if (editingCategory) {
        await categoryApi.update(editingCategory._id, {
          name: name.trim(),
          type,
          color,
          icon,
        });
      } else {
        await categoryApi.create({
          name: name.trim(),
          type,
          color,
          icon,
        });
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi lưu danh mục');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (cat: Category) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa danh mục "${cat.name}"?`)) return;

    setDeletingId(cat._id);
    try {
      await categoryApi.delete(cat._id);
      fetchCategories();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Không thể xóa danh mục này');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredCategories = categories.filter((c) => {
    if (activeTab === 'all') return true;
    return c.type === activeTab;
  });

  const expenseCount = categories.filter((c) => c.type === 'expense').length;
  const incomeCount = categories.filter((c) => c.type === 'income').length;

  return (
    <div className="min-h-screen pb-20 md:pb-8 space-y-6">
      <Header title="Quản Lý Danh Mục" />

      <main className="px-4 md:px-8 space-y-6">
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl glass-card border border-slate-200/80 dark:border-slate-800/80">
          {/* Tabs */}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-xl">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all ${
                activeTab === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Tất cả ({categories.length})
            </button>
            <button
              onClick={() => setActiveTab('expense')}
              className={`px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'expense'
                  ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Chi tiêu</span>
              <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-rose-500/10 text-rose-500 font-bold">
                {expenseCount}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('income')}
              className={`px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'income'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Thu nhập</span>
              <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-emerald-500/10 text-emerald-500 font-bold">
                {incomeCount}
              </span>
            </button>
          </div>

          {/* Add Category Button */}
          <button
            onClick={handleOpenAdd}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold text-sm shadow-md shadow-emerald-500/20 hover:opacity-95 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm danh mục mới</span>
          </button>
        </div>

        {/* Categories Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-24 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse p-4"
              ></div>
            ))}
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="p-12 text-center rounded-2xl glass-card border border-slate-200/80 dark:border-slate-800/80">
            <Tag className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-60" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">Chưa có danh mục nào</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredCategories.map((cat) => (
              <div
                key={cat._id}
                className="group relative p-4 rounded-2xl glass-card border border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex items-center justify-between gap-3 shadow-sm hover:shadow-md"
              >
                {/* Left: Icon & Badge & Name */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold shadow-sm shrink-0 transition-transform group-hover:scale-105"
                    style={{ backgroundColor: cat.color || '#10B981' }}
                  >
                    <CategoryIcon iconName={cat.icon} className="w-5 h-5" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                        {cat.name}
                      </h4>
                      {cat.isSystem && (
                        <span title="Danh mục hệ thống">
                          <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          cat.type === 'expense'
                            ? 'bg-rose-500/10 text-rose-500'
                            : 'bg-emerald-500/10 text-emerald-500'
                        }`}
                      >
                        {cat.type === 'expense' ? 'Chi tiêu' : 'Thu nhập'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {cat.isSystem ? 'Hệ thống' : 'Tùy chỉnh'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Actions for all categories */}
                <div className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleOpenEdit(cat)}
                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-indigo-500 transition-colors"
                    title="Sửa danh mục"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(cat)}
                    disabled={deletingId === cat._id}
                    className="p-2 rounded-lg hover:bg-rose-500/10 text-slate-500 hover:text-rose-500 transition-colors disabled:opacity-50"
                    title="Xóa danh mục"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Tag className="w-5 h-5 text-emerald-500" />
                <span>{editingCategory ? 'Sửa Danh Mục' : 'Thêm Danh Mục Mới'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type Toggle */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                  Loại danh mục
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setType('expense')}
                    className={`py-2 rounded-lg text-xs font-bold transition-all ${
                      type === 'expense'
                        ? 'bg-rose-500 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Chi tiêu
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('income')}
                    className={`py-2 rounded-lg text-xs font-bold transition-all ${
                      type === 'income'
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Thu nhập
                  </button>
                </div>
              </div>

              {/* Category Name */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                  Tên danh mục <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Ăn uống, Thưởng dự án..."
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Color Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                  Màu sắc đại diện
                </label>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {COLOR_PRESETS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 active:scale-95 shadow-sm"
                      style={{ backgroundColor: c }}
                    >
                      {color === c && <Check className="w-4 h-4 text-white" />}
                    </button>
                  ))}
                  {/* Custom color input */}
                  <div className="relative w-8 h-8 rounded-full overflow-hidden border border-slate-300 dark:border-slate-700 cursor-pointer">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer border-0 p-0"
                      title="Chọn màu tùy chỉnh"
                    />
                  </div>
                </div>
              </div>

              {/* Icon Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                  Biểu tượng (Icon)
                </label>
                <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-40 overflow-y-auto p-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950">
                  {Object.keys(ICON_MAP).map((iconKey) => (
                    <button
                      key={iconKey}
                      type="button"
                      onClick={() => setIcon(iconKey)}
                      className={`p-2.5 rounded-xl flex items-center justify-center transition-all ${
                        icon === iconKey
                          ? 'bg-emerald-500 text-white shadow-md'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                      }`}
                    >
                      <CategoryIcon iconName={iconKey} className="w-5 h-5" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm shadow-md shadow-emerald-500/20 hover:opacity-95 active:scale-95 transition-all disabled:opacity-50"
                >
                  {submitting ? 'Đang lưu...' : editingCategory ? 'Lưu cập nhật' : 'Thêm danh mục'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
