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
import { PieChartItem, BarChartItem, LineChartItem, TopCategoryItem } from '@/entities/analytics/analyticsApi';
import { formatVND } from '@/shared/lib/formatters';

interface ChartsProps {
  pieData: PieChartItem[];
  barData: BarChartItem[];
  lineData: LineChartItem[];
  topCategories: TopCategoryItem[];
}

export const ChartsSection: React.FC<ChartsProps> = ({ pieData, barData, lineData, topCategories }) => {
  const COLORS = ['#F43F5E', '#F97316', '#EC4899', '#EAB308', '#6366F1', '#A855F7', '#06B6D4', '#14B8A6'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
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
              <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `${v / 1000000}M`} />
              <Tooltip formatter={(value: any) => formatVND(Number(value))} />
              <Legend />
              <Bar dataKey="income" name="Thu nhập" fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="Chi tiêu" fill="#F43F5E" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Biểu đồ Đường: Xu Hướng Chi Tiêu Theo Ngày */}
      <div className="lg:col-span-8 p-5 rounded-2xl glass-card border border-slate-200/80 dark:border-slate-800/80">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
          Xu Hướng Chi Tiêu Theo Ngày Trong Tháng
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip formatter={(value: any) => formatVND(Number(value))} />
              <Line type="monotone" dataKey="amount" name="Chi tiêu" stroke="#6366F1" strokeWidth={3} dot={{ r: 3 }} />
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
