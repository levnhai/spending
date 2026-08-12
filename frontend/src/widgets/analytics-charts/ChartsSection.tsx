'use client';

import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';
import { PieChartItem, BarChartItem, LineChartItem, TopCategoryItem, WeeklyChartItem } from '@/entities/analytics/analyticsApi';
import { formatVND } from '@/shared/lib/formatters';

interface ChartsProps {
  pieData: PieChartItem[];
  barData: BarChartItem[];
  lineData: LineChartItem[];
  topCategories: TopCategoryItem[];
  weeklyData?: WeeklyChartItem[];
}

const formatAxisVND = (v: number): string => {
  if (v === 0) return '0đ';
  if (Math.abs(v) >= 1_000_000_000) {
    const val = v / 1_000_000_000;
    return `${Number.isInteger(val) ? val : val.toFixed(1)}B`;
  }
  if (Math.abs(v) >= 1_000_000) {
    const val = v / 1_000_000;
    return `${Number.isInteger(val) ? val : val.toFixed(1)}M`;
  }
  if (Math.abs(v) >= 1_000) {
    const val = v / 1_000;
    return `${Number.isInteger(val) ? val : val.toFixed(1)}k`;
  }
  return `${v}đ`;
};

export const ChartsSection: React.FC<ChartsProps> = ({ pieData, barData, lineData, topCategories, weeklyData = [] }) => {
  const [isMounted, setIsMounted] = React.useState(false);
  const COLORS = ['#F43F5E', '#F97316', '#EC4899', '#EAB308', '#6366F1', '#A855F7', '#06B6D4', '#14B8A6'];

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-12 p-5 rounded-2xl glass-card border border-slate-200/80 dark:border-slate-800/80 h-80 flex items-center justify-center text-slate-400 text-sm">
          Đang tải biểu đồ...
        </div>
        <div className="lg:col-span-5 p-5 rounded-2xl glass-card border border-slate-200/80 dark:border-slate-800/80 h-72 flex items-center justify-center text-slate-400 text-sm">
          Đang tải biểu đồ...
        </div>
        <div className="lg:col-span-7 p-5 rounded-2xl glass-card border border-slate-200/80 dark:border-slate-800/80 h-72 flex items-center justify-center text-slate-400 text-sm">
          Đang tải biểu đồ...
        </div>
        <div className="lg:col-span-8 p-5 rounded-2xl glass-card border border-slate-200/80 dark:border-slate-800/80 h-72 flex items-center justify-center text-slate-400 text-sm">
          Đang tải biểu đồ...
        </div>
        <div className="lg:col-span-4 p-5 rounded-2xl glass-card border border-slate-200/80 dark:border-slate-800/80 h-72 flex items-center justify-center text-slate-400 text-sm">
          Đang tải biểu đồ...
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Biểu đồ Cột: Thu & Chi Trong 1 Tuần */}
      <div className="lg:col-span-12 p-5 rounded-2xl glass-card border border-slate-200/80 dark:border-slate-800/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>📊</span> Thu & Chi Theo Ngày Trong Tuần
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              So sánh dòng tiền thu nhập và chi tiêu 7 ngày trong tuần hiện tại
            </p>
          </div>
        </div>
        <div className="h-72">
          {weeklyData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm">
              Đang tải dữ liệu biểu đồ tuần...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis
                  dataKey="day"
                  stroke="#94a3b8"
                  fontSize={12}
                  tickFormatter={(val, index) => {
                    const item = weeklyData[index];
                    return item ? `${val} (${item.fullDate})` : val;
                  }}
                />
                <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={formatAxisVND} />
                <Tooltip
                  formatter={(value: any) => formatVND(Number(value))}
                  labelFormatter={(label, payload) => {
                    const item = payload?.[0]?.payload;
                    return item ? `${label} (${item.fullDate})` : label;
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                <Bar dataKey="income" name="Thu nhập" fill="#10B981" radius={[6, 6, 0, 0]} maxBarSize={40} />
                <Bar dataKey="expense" name="Chi tiêu" fill="#F43F5E" radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Biểu đồ Tròn: Tỷ Lệ Chi Tiêu Danh Mục */}
      <div className="lg:col-span-5 p-5 rounded-2xl glass-card border border-slate-200/80 dark:border-slate-800/80">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
          Tỷ Lệ Chi Tiêu Theo Danh Mục
        </h3>
        {pieData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
            Chưa có dữ liệu chi tiêu tháng này
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => formatVND(Number(value))} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Biểu đồ Cột: So Sánh Thu Chi Theo Tháng */}
      <div className="lg:col-span-7 p-5 rounded-2xl glass-card border border-slate-200/80 dark:border-slate-800/80">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
          So Sánh Thu vs Chi Theo Tháng (Năm nay)
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={formatAxisVND} />
              <Tooltip formatter={(value: any) => formatVND(Number(value))} />
              <Legend />
              <Bar dataKey="income" name="Thu nhập" fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="Chi tiêu" fill="#F43F5E" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Biểu đồ Đường: Xu Hướng Thu Nhập & Chi Tiêu Theo Ngày */}
      <div className="lg:col-span-8 p-5 rounded-2xl glass-card border border-slate-200/80 dark:border-slate-800/80">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
          Biến Động Thu Nhập & Chi Tiêu Theo Ngày Trong Tháng
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={formatAxisVND} />
              <Tooltip formatter={(value: any) => formatVND(Number(value))} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Line type="monotone" dataKey="income" name="Thu nhập" stroke="#10B981" strokeWidth={3} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="expense" name="Chi tiêu" stroke="#F43F5E" strokeWidth={3} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Danh Mục Chi Nhiều Nhất */}
      <div className="lg:col-span-4 p-5 rounded-2xl glass-card border border-slate-200/80 dark:border-slate-800/80">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
          🔥 Top Danh Mục Chi Nhiều Nhất
        </h3>
        {topCategories.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
            Chưa có chi tiêu
          </div>
        ) : (
          <div className="space-y-4">
            {topCategories.map((cat, i) => (
              <div key={i} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }}></span>
                    {cat.name}
                  </span>
                  <span className="text-slate-900 dark:text-white font-bold">{formatVND(cat.value)} ({cat.percentage}%)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
