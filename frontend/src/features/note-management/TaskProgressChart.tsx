'use client';

import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Calendar, CheckCircle2, Clock, AlertTriangle, TrendingUp, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import { NoteItem } from '@/entities/note';

interface TaskProgressChartProps {
  notes: NoteItem[];
}

const STATUS_COLORS = {
  todo: '#94a3b8',        // slate
  in_progress: '#3b82f6', // blue
  completed: '#10b981',   // emerald
  cancelled: '#f43f5e',   // rose
};

export const TaskProgressChart: React.FC<TaskProgressChartProps> = ({ notes }) => {
  const [timeframe, setTimeframe] = useState<'day' | 'month'>('month');

  const tasks = useMemo(() => notes.filter((n) => n.type === 'task'), [notes]);

  // Overall Statistics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length;
  const todoTasks = tasks.filter((t) => t.status === 'todo').length;
  const cancelledTasks = tasks.filter((t) => t.status === 'cancelled').length;

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Check overdue tasks
  const overdueTasksCount = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return tasks.filter((t) => t.status !== 'completed' && t.dueDate && new Date(t.dueDate) < today).length;
  }, [tasks]);

  // Pie chart data for Status distribution
  const pieData = useMemo(() => {
    return [
      { name: 'Cần làm', value: todoTasks, color: STATUS_COLORS.todo },
      { name: 'Đang làm', value: inProgressTasks, color: STATUS_COLORS.in_progress },
      { name: 'Hoàn thành', value: completedTasks, color: STATUS_COLORS.completed },
      { name: 'Đã hủy', value: cancelledTasks, color: STATUS_COLORS.cancelled },
    ].filter((item) => item.value > 0);
  }, [todoTasks, inProgressTasks, completedTasks, cancelledTasks]);

  // Bar chart data according to time (day or month)
  const barData = useMemo(() => {
    const map: Record<string, { label: string; total: number; completed: number }> = {};

    tasks.forEach((t) => {
      const dateObj = new Date(t.createdAt);
      let key = '';
      if (timeframe === 'day') {
        key = dateObj.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
      } else {
        key = `Thg ${dateObj.getMonth() + 1}/${dateObj.getFullYear().toString().slice(-2)}`;
      }

      if (!map[key]) {
        map[key] = { label: key, total: 0, completed: 0 };
      }
      map[key].total += 1;
      if (t.status === 'completed') {
        map[key].completed += 1;
      }
    });

    return Object.values(map);
  }, [tasks, timeframe]);

  return (
    <div className="space-y-6">
      {/* Top Progress Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex items-center gap-3.5 shadow-sm">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Tỷ lệ hoàn thành</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-900 dark:text-white">{completionRate}%</span>
              <span className="text-xs text-emerald-500 font-bold">({completedTasks}/{totalTasks})</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex items-center gap-3.5 shadow-sm">
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Đang thực hiện</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white">{inProgressTasks}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex items-center gap-3.5 shadow-sm">
          <div className="p-3 rounded-xl bg-slate-500/10 text-slate-500">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Cần làm (Todo)</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white">{todoTasks}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex items-center gap-3.5 shadow-sm">
          <div className="p-3 rounded-xl bg-rose-500/10 text-rose-500">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Công việc quá hạn</span>
            <span className="text-2xl font-black text-rose-500">{overdueTasksCount}</span>
          </div>
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart: Progress Over Time */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-500" />
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Số lượng Task & Tiến độ hoàn thành
              </h3>
            </div>

            {/* Timeframe Switcher */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setTimeframe('day')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  timeframe === 'day'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Theo Ngày
              </button>
              <button
                onClick={() => setTimeframe('month')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  timeframe === 'month'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Theo Tháng
              </button>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            {barData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Chưa có dữ liệu công việc trong khoảng thời gian này
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#1e293b',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="total" name="Tổng công việc" fill="#64748b" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="completed" name="Đã hoàn thành" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Pie Chart: Status Distribution */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl space-y-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2">
            <PieChartIcon className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Phân bổ Trạng thái Task
            </h3>
          </div>

          <div className="h-52 w-full relative flex items-center justify-center">
            {pieData.length === 0 ? (
              <div className="text-xs text-slate-400">Chưa có công việc nào</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#1e293b',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Legend Items */}
          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-slate-600 dark:text-slate-400 font-medium truncate">
                  {item.name}: <strong>{item.value}</strong>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
