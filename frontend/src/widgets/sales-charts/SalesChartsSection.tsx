'use client';

import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import { DollarSign, PackageCheck, TrendingUp, Wallet, PieChart as PieChartIcon } from 'lucide-react';
import { OrderStats, ORDER_STATUS_CONFIG } from '@/entities/order';
import { formatVND } from '@/shared/lib/formatters';

import { useUserStore } from '@/entities/user/useUserStore';

interface SalesChartsSectionProps {
  stats: OrderStats | null;
}

export const SalesChartsSection: React.FC<SalesChartsSectionProps> = ({ stats }) => {
  const [isMounted, setIsMounted] = useState(false);
  const showAmount = useUserStore((s) => s.showAmount);

  const renderAmount = (val: number) => (showAmount ? formatVND(val) : '••••••••');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 h-80 flex items-center justify-center text-slate-400 text-xs">
          Đang tải biểu đồ tròn tài chính...
        </div>
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 h-80 flex items-center justify-center text-slate-400 text-xs">
          Đang tải biểu đồ tròn trạng thái...
        </div>
      </div>
    );
  }

  // 1. Dữ liệu Biểu đồ tròn: Cơ Cấu Tài Chính / Tiền (Vốn, Ship, Lợi Nhuận)
  const revenue = stats?.totalRevenue || 0;
  const cost = stats?.totalCostPrice || 0;
  const ship = stats?.totalShippingFee || 0;
  const profit = stats?.profit || 0;

  // Lát cắt cấu thành Tổng Doanh Thu
  const moneyPieData = [
    {
      name: 'Tiền Vốn',
      value: cost,
      color: '#F59E0B', // Amber
      description: 'Giá vốn hàng đã bán',
    },
    {
      name: 'Phí Vận Chuyển',
      value: ship,
      color: '#8B5CF6', // Purple
      description: 'Tổng tiền cước ship',
    },
    {
      name: 'Lợi Nhuận',
      value: profit > 0 ? profit : (cost === 0 && ship === 0 && revenue > 0 ? revenue : 0),
      color: profit >= 0 ? '#10B981' : '#EF4444', // Emerald / Rose
      description: 'Lợi nhuận thực tế',
    },
  ];

  const totalMoneyPie = moneyPieData.reduce((sum, item) => sum + item.value, 0);

  // 2. Dữ liệu Biểu đồ tròn: Trạng Thái Đơn Hàng
  const statusPieData = [
    {
      name: 'Đã đặt',
      value: stats?.orderedCount || 0,
      color: ORDER_STATUS_CONFIG.ORDERED.color,
    },
    {
      name: 'Kho Việt Nam',
      value: stats?.vnWarehouseCount || 0,
      color: ORDER_STATUS_CONFIG.VN_WAREHOUSE.color,
    },
    {
      name: 'Nhà',
      value: stats?.atHomeCount || 0,
      color: ORDER_STATUS_CONFIG.AT_HOME.color,
    },
    {
      name: 'Thành công',
      value: stats?.completedOrders || 0,
      color: ORDER_STATUS_CONFIG.COMPLETED.color,
    },
    {
      name: 'Đã hủy',
      value: stats?.cancelledOrders || 0,
      color: ORDER_STATUS_CONFIG.CANCELLED.color,
    },
  ];

  const totalStatusCount = statusPieData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* ================= BIỂU ĐỒ TRÒN 1: CƠ CẤU TIỀN & LỢI NHUẬN ================= */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-2xl bg-emerald-500/10 text-emerald-500">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Tiền & Lợi Nhuận
                </h3>
                <p className="text-xs text-slate-400">
                  Tỷ lệ phân bổ: Tiền vốn, Phí ship và Lợi nhuận
                </p>
              </div>
            </div>

            <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20">
              Tỷ suất: {stats?.profitMargin || 0}%
            </span>
          </div>
        </div>

        {/* Donut Chart & Legend */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
          {/* Donut Pie */}
          <div className="sm:col-span-6 h-56 relative flex items-center justify-center">
            {totalMoneyPie === 0 ? (
              <div className="text-center text-slate-400 text-xs">
                Chưa có dữ liệu doanh thu
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={moneyPieData.filter((d) => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {moneyPieData.map((entry, index) => (
                      <Cell key={`cell-money-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        const percent =
                          totalMoneyPie > 0
                            ? ((data.value / totalMoneyPie) * 100).toFixed(1)
                            : '0';
                        return (
                          <div className="p-2.5 rounded-2xl bg-slate-900 border border-slate-700 shadow-xl text-xs space-y-1">
                            <p className="font-bold text-white flex items-center gap-1.5">
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: data.color }}
                              />
                              {data.name}
                            </p>
                            <p className="text-emerald-400 font-black text-sm">
                              {renderAmount(data.value)} ({percent}%)
                            </p>
                            <p className="text-[10px] text-slate-400">{data.description}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}

            {/* Center Label inside Donut */}
            {totalMoneyPie > 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-2 text-center">
                <span className="text-xs font-bold text-slate-400">Doanh thu</span>
                <span className="text-sm font-black text-slate-900 dark:text-white truncate max-w-[100px]">
                  {renderAmount(revenue)}
                </span>
              </div>
            )}
          </div>

          {/* Breakdown List */}
          <div className="sm:col-span-6 space-y-2">
            {moneyPieData.map((item, idx) => {
              const percent =
                totalMoneyPie > 0
                  ? Math.round((item.value / totalMoneyPie) * 100)
                  : 0;

              return (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                        {item.name}
                      </span>
                      <span className="text-[10px] text-slate-400 block">{item.description}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-slate-900 dark:text-white block">
                      {renderAmount(item.value)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {percent}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Summary */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span>Doanh thu thuần (trừ ship):</span>
          <strong className="text-blue-500 font-bold">{renderAmount(stats?.netRevenue || 0)}</strong>
        </div>
      </div>

      {/* ================= BIỂU ĐỒ TRÒN 2: TRẠNG THÁI ĐƠN HÀNG ================= */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-2xl bg-blue-500/10 text-blue-500">
                <PackageCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Trạng Thái Đơn Hàng
                </h3>
                <p className="text-xs text-slate-400">
                  Tỷ lệ phân bố số lượng đơn theo 5 giai đoạn xử lý
                </p>
              </div>
            </div>

            <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2.5 py-1 rounded-xl border border-blue-500/20">
              {stats?.totalOrders || 0} Đơn
            </span>
          </div>
        </div>

        {/* Donut Chart & Legend */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
          {/* Donut Pie */}
          <div className="sm:col-span-6 h-56 relative flex items-center justify-center">
            {totalStatusCount === 0 ? (
              <div className="text-center text-slate-400 text-xs">
                Chưa có dữ liệu đơn hàng
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData.filter((d) => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-status-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        const percent =
                          totalStatusCount > 0
                            ? ((data.value / totalStatusCount) * 100).toFixed(1)
                            : '0';
                        return (
                          <div className="p-2.5 rounded-2xl bg-slate-900 border border-slate-700 shadow-xl text-xs space-y-1">
                            <p className="font-bold text-white flex items-center gap-1.5">
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: data.color }}
                              />
                              {data.name}
                            </p>
                            <p className="text-white font-black">
                              {data.value} đơn ({percent}%)
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}

            {/* Center Label inside Donut */}
            {totalStatusCount > 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {stats?.completedOrders || 0}
                </span>
                <span className="text-[10px] font-semibold text-slate-400">
                  Thành công
                </span>
              </div>
            )}
          </div>

          {/* Status List Breakdown */}
          <div className="sm:col-span-6 space-y-2">
            {statusPieData.map((item, idx) => {
              const percent =
                totalStatusCount > 0
                  ? Math.round((item.value / totalStatusCount) * 100)
                  : 0;

              return (
                <div
                  key={idx}
                  className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {item.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {item.value} đơn
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium w-8 text-right">
                      {percent}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary Footer */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span>Tỷ lệ hoàn thành đơn:</span>
          <strong className="text-emerald-500 font-bold">
            {stats?.completionRate || 0}% ({stats?.completedOrders || 0}/{stats?.totalOrders || 0} đơn)
          </strong>
        </div>
      </div>
    </div>
  );
};
