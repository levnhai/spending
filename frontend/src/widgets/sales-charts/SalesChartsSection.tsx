'use client';

import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import {
  DollarSign,
  PackageCheck,
  TrendingUp,
  BarChart3,
  Calendar,
} from 'lucide-react';
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
      <div className="space-y-6">
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 h-72 flex items-center justify-center text-slate-400 text-xs">
          Đang tải biểu đồ lợi nhuận...
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 h-80 flex items-center justify-center text-slate-400 text-xs">
            Đang tải biểu đồ tròn tài chính...
          </div>
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 h-80 flex items-center justify-center text-slate-400 text-xs">
            Đang tải biểu đồ tròn trạng thái...
          </div>
        </div>
      </div>
    );
  }

  // 1. Dữ liệu Biểu đồ tròn: Cơ Cấu Tài Chính (Vốn, Ship, Lợi Nhuận)
  const revenue = stats?.totalRevenue || 0;
  const cost = stats?.totalCostPrice || 0;
  const ship = stats?.totalShippingFee || 0;
  const profit = stats?.profit || 0;

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
      name: 'Kho Trung',
      value: stats?.cnWarehouseCount || 0,
      color: ORDER_STATUS_CONFIG.CN_WAREHOUSE.color,
    },
    {
      name: 'Kho Việt',
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

  // 3. Dữ liệu Biểu đồ Cột: Lợi Nhuận Theo Dòng Thời Gian (Timeline Bar Chart)
  const timelineData = stats?.timeline || [];
  const period = stats?.period || 'all';

  const getTimelineSubtitle = () => {
    switch (period) {
      case 'today':
        return 'Lợi nhuận theo các khung giờ trong ngày hôm nay';
      case 'week':
        return 'Lợi nhuận theo các ngày trong tuần (Thứ 2 - Chủ Nhật)';
      case 'month':
        return 'Lợi nhuận theo từng ngày trong tháng này';
      case 'year':
        return 'Lợi nhuận theo 12 tháng trong năm nay';
      default:
        return 'Lợi nhuận theo các tháng gần nhất';
    }
  };

  // Format trục Y rút gọn
  const formatYAxis = (val: number) => {
    if (!showAmount) return '••••';
    if (Math.abs(val) >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1)}B`;
    if (Math.abs(val) >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
    if (Math.abs(val) >= 1_000) return `${(val / 1_000).toFixed(0)}k`;
    return `${val}`;
  };

  return (
    <div className="space-y-6">
      {/* ================= BIỂU ĐỒ CỘT: LỢI NHUẬN THEO THỜI GIAN ================= */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-emerald-500/10 text-emerald-500">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                Biến Động Lợi Nhuận
                <span className="text-xs px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold border border-emerald-500/20">
                  {renderAmount(profit)}
                </span>
              </h3>
              <p className="text-xs text-slate-400">{getTimelineSubtitle()}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
              <span className="w-3 h-3 rounded-md bg-emerald-500 inline-block" />
              <span>Lợi Nhuận</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400 font-medium ml-2">
              <span className="w-3 h-3 rounded-md bg-blue-500/30 inline-block" />
              <span>Doanh Thu</span>
            </div>
          </div>
        </div>

        {/* Recharts Bar Chart */}
        <div className="h-64 sm:h-72 w-full pt-2">
          {timelineData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs">
              Chưa có dữ liệu thống kê trong kỳ này
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={timelineData}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#334155"
                  opacity={0.25}
                />
                <XAxis
                  dataKey="label"
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#334155', opacity: 0.3 }}
                />
                <YAxis
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatYAxis}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255, 255, 255, 0.05)', radius: 8 }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="p-3 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl text-xs space-y-1.5 min-w-[170px]">
                          <p className="font-bold text-white border-b border-slate-800 pb-1 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{label}</span>
                          </p>
                          <div className="flex items-center justify-between text-slate-300">
                            <span>Doanh thu:</span>
                            <strong className="font-bold text-blue-400">{renderAmount(data.revenue)}</strong>
                          </div>
                          <div className="flex items-center justify-between text-slate-300">
                            <span>Tiền vốn:</span>
                            <span className="font-medium text-amber-400">{renderAmount(data.cost)}</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-300">
                            <span>Phí ship:</span>
                            <span className="font-medium text-purple-400">{renderAmount(data.shipping)}</span>
                          </div>
                          <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                            <span className="font-bold text-slate-200">Lợi Nhuận:</span>
                            <strong
                              className={`font-black text-sm ${
                                data.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              {renderAmount(data.profit)}
                            </strong>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {/* Cột Doanh Thu Mờ nền */}
                <Bar
                  dataKey="revenue"
                  name="Doanh thu"
                  fill="#3B82F6"
                  opacity={0.2}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={32}
                />
                {/*feat: implement order management system with status tracking and editing capabilities Cột Lợi Nhuận Chính */}
                <Bar
                  dataKey="profit"
                  name="Lợi nhuận"
                  fill="#10B981"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ================= 2 BIỂU ĐỒ TRÒN (CƠ CẤU TIỀN & TRẠNG THÁI) ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Biểu đồ tròn 1: Cơ Cấu Tiền & Lợi Nhuận */}
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

        {/* Biểu đồ tròn 2: Trạng Thái Đơn Hàng */}
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
                    Phân bổ tiến độ thực hiện các đơn hàng
                  </p>
                </div>
              </div>

              <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2.5 py-1 rounded-xl border border-blue-500/20">
                {stats?.totalOrders || 0} đơn
              </span>
            </div>
          </div>

          {/* Donut Pie & Legend */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
            {/* Donut Pie */}
            <div className="sm:col-span-6 h-56 relative flex items-center justify-center">
              {totalStatusCount === 0 ? (
                <div className="text-center text-slate-400 text-xs">
                  Chưa có đơn hàng nào
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
                              <p className="text-white font-black text-sm">
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
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-2 text-center">
                  <span className="text-xs font-bold text-slate-400">Hoàn thành</span>
                  <span className="text-base font-black text-emerald-500">
                    {stats?.completionRate || 0}%
                  </span>
                </div>
              )}
            </div>

            {/* Status Breakdown List */}
            <div className="sm:col-span-6 space-y-1.5">
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
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {item.name}
                      </span>
                    </div>

                    <div className="text-right flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {item.value} <span className="text-[10px] font-normal text-slate-400">đơn</span>
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

          {/* Footer Summary */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Đơn đang xử lý:</span>
            <strong className="text-purple-500 font-bold">{stats?.inProgressCount || 0} đơn</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
