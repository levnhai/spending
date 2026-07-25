'use client';

import React from 'react';
import { Pin, Edit3, Trash2, Tag, Clock, CheckSquare, AlertCircle, CalendarCheck, Square, CheckCircle2 } from 'lucide-react';
import { NoteItem, NoteColor, TaskStatus } from '../model/types';

interface NoteCardProps {
  note: NoteItem;
  onEdit: (note: NoteItem) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  onStatusChange?: (id: string, status: TaskStatus) => void;
}

const colorMap: Record<NoteColor, { border: string; bg: string; badge: string; accent: string }> = {
  emerald: {
    border: 'border-emerald-200 dark:border-emerald-900/50',
    bg: 'bg-gradient-to-br from-emerald-50/80 to-teal-50/40 dark:from-emerald-950/20 dark:to-slate-900',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    accent: 'text-emerald-600 dark:text-emerald-400',
  },
  blue: {
    border: 'border-blue-200 dark:border-blue-900/50',
    bg: 'bg-gradient-to-br from-blue-50/80 to-cyan-50/40 dark:from-blue-950/20 dark:to-slate-900',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    accent: 'text-blue-600 dark:text-blue-400',
  },
  amber: {
    border: 'border-amber-200 dark:border-amber-900/50',
    bg: 'bg-gradient-to-br from-amber-50/80 to-orange-50/40 dark:from-amber-950/20 dark:to-slate-900',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    accent: 'text-amber-600 dark:text-amber-400',
  },
  purple: {
    border: 'border-purple-200 dark:border-purple-900/50',
    bg: 'bg-gradient-to-br from-purple-50/80 to-indigo-50/40 dark:from-purple-950/20 dark:to-slate-900',
    badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    accent: 'text-purple-600 dark:text-purple-400',
  },
  rose: {
    border: 'border-rose-200 dark:border-rose-900/50',
    bg: 'bg-gradient-to-br from-rose-50/80 to-pink-50/40 dark:from-rose-950/20 dark:to-slate-900',
    badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
    accent: 'text-rose-600 dark:text-rose-400',
  },
  slate: {
    border: 'border-slate-200 dark:border-slate-800',
    bg: 'bg-gradient-to-br from-slate-50/80 to-slate-100/40 dark:from-slate-800/40 dark:to-slate-900',
    badge: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
    accent: 'text-slate-600 dark:text-slate-400',
  },
};

const statusLabels: Record<TaskStatus, { label: string; style: string }> = {
  todo: { label: 'Cần làm', style: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  in_progress: { label: 'Đang thực hiện', style: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  completed: { label: 'Hoàn thành', style: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  cancelled: { label: 'Đã hủy', style: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' },
};

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  onEdit,
  onDelete,
  onTogglePin,
  onStatusChange,
}) => {
  const styles = colorMap[note.color] || colorMap.slate;
  const isTask = note.type === 'task';
  const isCompleted = note.status === 'completed';

  const isOverdue = React.useMemo(() => {
    if (!note.dueDate || isCompleted) return false;
    const due = new Date(note.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  }, [note.dueDate, isCompleted]);

  const handleToggleComplete = () => {
    if (!onStatusChange) return;
    onStatusChange(note.id, isCompleted ? 'todo' : 'completed');
  };

  return (
    <div
      className={`group relative flex flex-col justify-between rounded-2xl border p-5 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${styles.border} ${styles.bg}`}
    >
      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles.badge}`}>
              {note.category}
            </span>
            {isTask ? (
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-500/10 to-indigo-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                <CheckSquare className="w-3.5 h-3.5" />
                Công việc
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                Ghi chú
              </span>
            )}
            {note.priority === 'high' && (
              <span className="flex items-center gap-1 text-[11px] text-rose-500 font-semibold">
                <AlertCircle className="w-3 h-3" /> Ưu tiên cao
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onTogglePin(note.id)}
              className={`p-1.5 rounded-lg transition-colors ${
                note.isPinned
                  ? 'text-amber-500 bg-amber-500/10'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800'
              }`}
              title={note.isPinned ? 'Bỏ ghim' : 'Ghim bài'}
            >
              <Pin className={`w-4 h-4 ${note.isPinned ? 'fill-amber-500' : ''}`} />
            </button>
            <button
              onClick={() => onEdit(note)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
              title="Chỉnh sửa"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(note.id)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
              title="Xóa"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Title & Quick Checkbox for Task */}
        <div className="flex items-start gap-2.5 mb-2">
          {isTask && onStatusChange && (
            <button
              type="button"
              onClick={handleToggleComplete}
              className="mt-0.5 text-slate-400 hover:text-emerald-500 transition-colors"
              title={isCompleted ? 'Đánh dấu chưa xong' : 'Đánh dấu đã hoàn thành'}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-500/20" />
              ) : (
                <Square className="w-5 h-5 hover:scale-105 transition-transform" />
              )}
            </button>
          )}

          <h3
            className={`font-bold text-base leading-snug flex-1 ${
              isCompleted
                ? 'line-through text-slate-400 dark:text-slate-500'
                : 'text-slate-900 dark:text-white'
            }`}
          >
            {note.title}
          </h3>
        </div>

        {/* Content */}
        <div className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line line-clamp-5 mb-4 pl-0.5">
          {note.content}
        </div>
      </div>

      {/* Footer info */}
      <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800/60 flex flex-col gap-2.5">
        {/* Task Status & Due Date */}
        {isTask && note.status && onStatusChange && (
          <div className="flex items-center justify-between gap-2 flex-wrap">
            {/* Status Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 dark:text-slate-400">Trạng thái:</span>
              <select
                value={note.status}
                onChange={(e) => onStatusChange(note.id, e.target.value as TaskStatus)}
                className={`text-xs font-semibold px-2.5 py-1 rounded-lg outline-none cursor-pointer border border-transparent transition-colors ${
                  statusLabels[note.status]?.style || ''
                }`}
              >
                <option value="todo">Cần làm</option>
                <option value="in_progress">Đang thực hiện</option>
                <option value="completed">Hoàn thành</option>
                <option value="cancelled">Đã hủy</option>
              </select>
            </div>

            {/* Due Date Indicator */}
            {note.dueDate && (
              <span
                className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md ${
                  isCompleted
                    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                    : isOverdue
                    ? 'text-rose-600 dark:text-rose-400 bg-rose-500/10 font-bold'
                    : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800'
                }`}
              >
                <CalendarCheck className="w-3.5 h-3.5" />
                {isOverdue ? 'Quá hạn: ' : 'Hạn: '}
                {new Date(note.dueDate).toLocaleDateString('vi-VN')}
              </span>
            )}
          </div>
        )}

        {/* Tags & Updated Time */}
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5 flex-wrap">
            {note.tags.map((tag) => (
              <span key={tag} className="flex items-center gap-0.5 text-slate-500 dark:text-slate-400">
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
          </div>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(note.updatedAt).toLocaleDateString('vi-VN')}
          </span>
        </div>
      </div>
    </div>
  );
};
