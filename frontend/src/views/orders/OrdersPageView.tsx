'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { Header } from '@/widgets/header/Header';
import { Order, OrderStats, OrderStatusType, orderApi } from '@/entities/order';
import { AddEditOrderModal } from '@/features/order-management';
import { OrderTable } from '@/widgets/order-table';

const STATUS_FILTERS: { id: string; label: string }[] = [
  { id: 'ALL', label: 'Tất cả trạng thái' },
  { id: 'ORDERED', label: 'Đã đặt' },
  { id: 'VN_WAREHOUSE', label: 'Kho Việt Nam' },
  { id: 'AT_HOME', label: 'Nhà' },
  { id: 'COMPLETED', label: 'Thành công' },
  { id: 'CANCELLED', label: 'Đã hủy' },
];

export const OrdersPageView: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState<Order | null>(null);

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

  return (
    <div className="min-h-screen pb-20 md:pb-8 space-y-5 w-full">
      {/* App Header Bar */}
      <Header
        title="Quản Lý Đơn Hàng"
        onOpenQuickAddOrder={handleCreateNew}
      />

      <main className="px-4 md:px-8 space-y-4 w-full">
        {/* Unified Action & Filter Toolbar trên 1 hàng */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-3xl glass-card border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          {/* Left Group: Search & Status Select */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
            {/* 1. Search Input */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên đơn hàng, mã đơn, khách, SĐT, Facebook..."
                className="w-full pl-9 pr-3.5 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/40 shadow-sm"
              />
            </div>

            {/* 2. Select Trạng Thái */}
            <div className="relative sm:w-52 shrink-0">
              <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-8 pr-7 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/40 shadow-sm cursor-pointer"
              >
                {STATUS_FILTERS.map((tab) => (
                  <option key={tab.id} value={tab.id}>
                    {tab.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Right Group: Refresh & Tạo Đơn Hàng */}
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              onClick={fetchData}
              className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
              title="Làm mới dữ liệu"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={handleCreateNew}
              className="flex items-center gap-2 px-4.5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs md:text-sm font-bold shadow-md shadow-emerald-500/20 hover:opacity-95 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo Đơn Hàng</span>
            </button>
          </div>
        </div>

        {/* Orders Table & Mobile Cards */}
        <OrderTable
          orders={orders}
          loading={loading}
          onEdit={handleEdit}
          onDeleted={fetchData}
          onStatusChanged={handleStatusChanged}
        />
      </main>

      {/* Modal Create / Edit Order */}
      <AddEditOrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchData}
        orderToEdit={orderToEdit}
      />
    </div>
  );
};
