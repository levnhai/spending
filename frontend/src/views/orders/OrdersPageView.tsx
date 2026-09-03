'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Search,
  Filter,
  RefreshCw,
  ChevronDown,
  Check,
} from 'lucide-react';
import { Header } from '@/widgets/header/Header';
import { Order, OrderStats, OrderStatusType, orderApi } from '@/entities/order';
import { AddEditOrderModal } from '@/features/order-management';
import { OrderTable } from '@/widgets/order-table';

const STATUS_FILTERS = [
  { id: 'ALL', label: 'Tất cả trạng thái', color: 'text-slate-400', dot: 'bg-slate-400' },
  { id: 'ORDERED', label: 'Đã đặt', color: 'text-blue-500', dot: 'bg-blue-500' },
  { id: 'VN_WAREHOUSE', label: 'Kho Việt Nam', color: 'text-orange-500', dot: 'bg-orange-500' },
  { id: 'AT_HOME', label: 'Nhà', color: 'text-purple-500', dot: 'bg-purple-500' },
  { id: 'COMPLETED', label: 'Thành công', color: 'text-emerald-500', dot: 'bg-emerald-500' },
  { id: 'CANCELLED', label: 'Đã hủy', color: 'text-rose-500', dot: 'bg-rose-500' },
];

export const OrdersPageView: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState<Order | null>(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsStatusDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersRes, statsRes] = await Promise.all([
        orderApi.getAll({
          search: search.trim() || undefined,
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
        }),
        orderApi.getStats(),
      ]);
      setOrders(ordersRes);
      setStats(statsRes);
    } catch (err) {
      console.error('Failed to load orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchData();
    }, 250);
    return () => clearTimeout(timeout);
  }, [search, statusFilter]);

  const handleCreateNew = () => {
    setOrderToEdit(null);
    setIsModalOpen(true);
  };

  const handleEdit = (order: Order) => {
    setOrderToEdit(order);
    setIsModalOpen(true);
  };

  const handleStatusChanged = (orderId: string, newStatus: OrderStatusType) => {
    setOrders((prev) =>
      prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o)),
    );
    orderApi.getStats().then(setStats).catch(() => {});
  };

  const currentSelectedFilter = STATUS_FILTERS.find((f) => f.id === statusFilter) || STATUS_FILTERS[0];

  return (
    <div className="min-h-screen pb-20 md:pb-8 space-y-5 w-full">
      {/* App Header Bar */}
      <Header
        title="Quản Lý Đơn Hàng"
        onOpenQuickAddOrder={handleCreateNew}
      />

      <main className="px-4 md:px-8 space-y-4 w-full">
        {/* Unified Action & Filter Toolbar trên 1 hàng duy nhất */}
        <div className="flex items-center justify-between gap-2 p-2.5 sm:p-3.5 rounded-2xl sm:rounded-3xl glass-card border border-slate-200/80 dark:border-slate-800/80 shadow-sm w-full">
          {/* Group: Search & Status Select trên 1 hàng */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {/* 1. Search Input */}
            <div className="relative flex-1 min-w-0">
              <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm đơn, khách, SĐT..."
                className="w-full pl-8 sm:pl-9 pr-3 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/40 shadow-sm"
              />
            </div>

            {/* 2. Custom Dropdown Select Trạng Thái */}
            <div className="relative w-36 sm:w-52 shrink-0" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                className="w-full flex items-center justify-between pl-2.5 sm:pl-3.5 pr-2.5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/40 shadow-sm hover:border-emerald-500/40 transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                  <Filter className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 shrink-0" />
                  <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shrink-0 ${currentSelectedFilter.dot}`} />
                  <span className="truncate font-bold text-[11px] sm:text-xs">{currentSelectedFilter.label}</span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
                    isStatusDropdownOpen ? 'rotate-180 text-emerald-500' : ''
                  }`}
                />
              </button>

              {/* Popup Menu Danh Sách Trạng Thái */}
              {isStatusDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 sm:w-full rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700/80 shadow-2xl p-1.5 space-y-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  {STATUS_FILTERS.map((item) => {
                    const isSelected = statusFilter === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setStatusFilter(item.id);
                          setIsStatusDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-colors duration-150 cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${item.dot}`} />
                          <span className="truncate">{item.label}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Group: Refresh & Tạo Đơn Hàng (Ẩn trên mobile vì đã có BottomNav và vuốt làm mới) */}
          <div className="hidden sm:flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              onClick={fetchData}
              className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
              title="Làm mới dữ liệu"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={handleCreateNew}
              className="flex items-center gap-2 px-4.5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs md:text-sm font-bold shadow-md shadow-emerald-500/20 hover:opacity-95 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo Đơn Hàng</span>
            </button>
          </div>
        </div>

        {/* Order Table Component */}
        <OrderTable
          orders={orders}
          loading={loading}
          onEdit={handleEdit}
          onDeleted={fetchData}
          onStatusChanged={handleStatusChanged}
        />
      </main>

      {/* Modal Tạo/Sửa Đơn Hàng */}
      <AddEditOrderModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setOrderToEdit(null);
        }}
        onSuccess={fetchData}
        orderToEdit={orderToEdit}
      />
    </div>
  );
};
