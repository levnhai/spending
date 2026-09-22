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

  const timelineData = stats?.timeline || [];
  const period = stats?.period || 'all';

  // Xác định mốc thời gian hiện tại (Hôm nay / Giờ này / Thứ này / Tháng này)
  const currentPeriodLabel = React.useMemo(() => {
    const now = new Date();
    if (period === 'today') {
      const h = now.getHours();
      const slots = [
        { label: '0h-3h', min: 0, max: 3 },
        { label: '3h-6h', min: 3, max: 6 },
        { label: '6h-9h', min: 6, max: 9 },
        { label: '9h-12h', min: 9, max: 12 },
        { label: '12h-15h', min: 12, max: 15 },
        { label: '15h-18h', min: 15, max: 18 },
        { label: '18h-21h', min: 18, max: 21 },
        { label: '21h-24h', min: 21, max: 24 },
      ];
      return slots.find((s) => h >= s.min && h < s.max)?.label || '15h-18h';
    }
    if (period === 'week') {
      const day = now.getDay();
      const mapDays: Record<number, string> = {
        0: 'Chủ Nhật',
        1: 'Thứ 2',
        2: 'Thứ 3',
        3: 'Thứ 4',
        4: 'Thứ 5',
        5: 'Thứ 6',
        6: 'Thứ 7',
      };
      return mapDays[day] || 'Thứ 2';
    }
    if (period === 'month') {
      return `N${now.getDate()}`;
    }
    if (period === 'year') {
      return `Tháng ${now.getMonth() + 1}`;
    }
    return '';
  }, [period]);

  const currentIndex = React.useMemo(() => {
    if (!currentPeriodLabel || !timelineData.length) return -1;
    return timelineData.findIndex((d) => d.label === currentPeriodLabel);
  }, [currentPeriodLabel, timelineData]);

  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  // Hàm tự động cuộn lấy ngày hiện tại làm trọng tâm giữa màn hình
  const scrollToCurrent = React.useCallback(() => {
    if (!scrollContainerRef.current || currentIndex < 0 || timelineData.length <= 10) return;
    const container = scrollContainerRef.current;
    const totalWidth = Math.max(timelineData.length * 38, 480);
    const itemWidth = totalWidth / timelineData.length;
    const targetCenter = (currentIndex + 0.5) * itemWidth;
    const scrollLeft = Math.max(0, targetCenter - container.clientWidth / 2);

    container.scrollTo({
      left: scrollLeft,
      behavior: 'smooth',
    });
  }, [currentIndex, timelineData.length]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    const timer = setTimeout(() => {
      scrollToCurrent();
    }, 200);
    return () => clearTimeout(timer);
  }, [isMounted, scrollToCurrent]);

  const renderAmount = (val: number) => (showAmount ? formatVND(val) : '••••••••');

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

  // 1. Dữ liệu Biểu đồ tròn: Cơ Cấu Tài Chính (Vốn, Ship VN, Ship TQ-VN, Lợi Nhuận)
  const revenue = stats?.totalRevenue || 0;
  const cost = stats?.totalCostPrice || 0;
  const ship = stats?.totalShippingFee || 0;
  const shipCnVn = stats?.totalShippingFeeCnVn || 0;
  const profit = stats?.profit || 0;

  const moneyPieData = [
    {
      name: 'Tiền Vốn',
      value: cost,
      color: '#F59E0B', // Amber
      description: 'Giá vốn hàng đã bán',
    },
    {
      name: 'Ship Khách',
      value: ship,
      color: '#06B6D4', // Cyan
      description: 'Tổng tiền cước ship khách',
    },
    {
      name: 'Ship TQ - VN',
      value: shipCnVn,
      color: '#F97316', // Orange
      description: 'Phí ship Trung về Việt',
    },
    {
      name: 'Lợi Nhuận',
      value: profit > 0 ? profit : (cost === 0 && ship === 0 && shipCnVn === 0 && revenue > 0 ? revenue : 0),
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

  // Format nhãn trục X chỉ hiển thị số (1, 2, 3... 12 hoặc 1, 2, 3... 31)
  const formatDisplayLabel = (label: any) => {
    if (!label) return '';
    const str = String(label);
    if (str.startsWith('Tháng ')) return str.replace('Tháng ', '');
    if (/^N\d+$/i.test(str)) return str.substring(1);
    return str;
  };

  const getFullTooltipTitle = (label?: string | number) => {
    if (label == null) return '';
    const str = String(label);
    if (/^N\d+$/i.test(str)) return `Ngày ${str.substring(1)}`;
    return str;
  };

  // Custom Tick Trục X làm nổi bật mốc ngày hiện tại
  const CustomXAxisTick = (props: any) => {
    const { x, y, payload } = props;
    const isCurrent = payload.value === currentPeriodLabel;
    const displayLabel = formatDisplayLabel(payload.value);

    return (
      <g transform={`translate(${x},${y})`}>
        {isCurrent && (
          <rect
            x={-11}
            y={2}
            width={22}
            height={16}
            rx={4}
            fill="#10B981"
            opacity={0.25}
          />
        )}
        <text
          x={0}
          y={14}
          textAnchor="middle"
          fill={isCurrent ? '#34D399' : '#64748B'}
          fontWeight={isCurrent ? '800' : '500'}
          fontSize={isCurrent ? 11 : 10}
        >
          {displayLabel}
        </text>
      </g>
    );
  };

  return (
    <div className="space-y-6">
      {/* ================= BIỂU ĐỒ CỘT: LỢI NHUẬN THEO THỜI GIAN ================= */}
      <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
        <div className="flex items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-emerald-500/10 text-emerald-500 shrink-0">
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                Biến Động Lợi Nhuận
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 truncate">
                {getTimelineSubtitle()}
              </p>
            </div>
          </div>

          {/* Badge Giá Tiền luôn luôn sát lề bên phải */}
          <div className="shrink-0 text-right">
            <span className="text-xs sm:text-sm px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold border border-emerald-500/20 whitespace-nowrap shadow-xs inline-block">
              {renderAmount(profit)}
            </span>
          </div>
        </div>

        {/* Recharts Bar Chart với Scroll Ngang & Focus Trọng Tâm */}
        <div className="w-full pt-2">
          {timelineData.length === 0 ? (
            <div className="h-64 sm:h-72 flex items-center justify-center text-slate-400 text-xs">
              Chưa có dữ liệu thống kê trong kỳ này
            </div>
          ) : (
            <div
              ref={scrollContainerRef}
              className="overflow-x-auto no-scrollbar -mx-2 px-2 scroll-smooth"
            >
              <div
                style={{
                  minWidth:
                    timelineData.length > 10
                      ? `${Math.max(timelineData.length * 38, 480)}px`
                      : '100%',
                }}
                className="h-64 sm:h-76 w-full"
              >
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
                      interval={0}
                      tick={<CustomXAxisTick />}
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
                          const isCurrent = label === currentPeriodLabel;
                          return (
                            <div className="p-3 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-slate-700 shadow-2xl text-xs space-y-1.5 min-w-[170px]">
                              <p className="font-bold text-white border-b border-slate-800 pb-1 flex items-center justify-between gap-1.5">
                                <span className="flex items-center gap-1.5">
                                  <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>{getFullTooltipTitle(label)}</span>
                                </span>
                                {isCurrent && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-extrabold border border-emerald-500/30">
                                    Hôm nay
                                  </span>
                                )}
                              </p>
                              <div className="flex items-center justify-between text-slate-300">
                                <span>Doanh thu:</span>
                                <strong className="font-bold text-blue-400">
                                  {renderAmount(data.revenue)}
                                </strong>
                              </div>
                              <div className="flex items-center justify-between text-slate-300">
                                <span>Tiền vốn:</span>
                                <span className="font-medium text-amber-400">
                                  {renderAmount(data.cost)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-slate-300">
                                <span>Phí ship:</span>
                                <span className="font-medium text-purple-400">
                                  {renderAmount(data.shipping)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                                <span className="font-bold text-slate-200">
                                  Lợi Nhuận:
                                </span>
                                <strong
                                  className={`font-black text-sm ${
                                    data.profit >= 0
                                      ? 'text-emerald-400'
                                      : 'text-rose-400'
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
                    {/* Cột Doanh Thu */}
                    <Bar
                      dataKey="revenue"
                      name="Doanh thu"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={24}
                    >
                      {timelineData.map((entry, index) => {
                        const isCurrent = index === currentIndex;
                        return (
                          <Cell
                            key={`cell-rev-${index}`}
                            fill={isCurrent ? '#60A5FA' : '#3B82F6'}
                            opacity={isCurrent ? 0.6 : 0.25}
                          />
                        );
                      })}
                    </Bar>
                    {/* Cột Lợi Nhuận Chính */}
                    <Bar
                      dataKey="profit"
                      name="Lợi nhuận"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={24}
                    >
                      {timelineData.map((entry, index) => {
                        const isCurrent = index === currentIndex;
                        return (
                          <Cell
                            key={`cell-profit-${index}`}
                            fill={isCurrent ? '#34D399' : '#10B981'}
                            stroke={isCurrent ? '#6EE7B7' : undefined}
                            strokeWidth={isCurrent ? 1.5 : 0}
                          />
                        );
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* Chú thích Legend nhỏ gọn đặt bên dưới biểu đồ */}
        <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-center gap-5 text-[10.5px] sm:text-xs text-slate-400 font-medium">
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span>Lợi Nhuận</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <span className="w-2 h-2 rounded-full bg-blue-500/50 inline-block" />
            <span>Doanh Thu</span>
          </div>
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
