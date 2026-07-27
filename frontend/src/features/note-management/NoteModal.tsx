'use client';

import React, { useState, useEffect } from 'react';
import { X, CheckSquare, StickyNote, Tag, Calendar, AlertCircle, Plus, Trash2, ListChecks } from 'lucide-react';
import { NoteItem, NoteType, NoteColor, NotePriority, TaskStatus, CreateNoteInput, SubTask } from '@/entities/note';

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateNoteInput) => void;
  initialData?: NoteItem | null;
}

const colorOptions: { key: NoteColor; label: string; bg: string }[] = [
  { key: 'emerald', label: 'Xanh lục', bg: 'bg-emerald-500' },
  { key: 'blue', label: 'Xanh dương', bg: 'bg-blue-500' },
  { key: 'amber', label: 'Vàng cam', bg: 'bg-amber-500' },
  { key: 'purple', label: 'Tím', bg: 'bg-purple-500' },
  { key: 'rose', label: 'Hồng đỏ', bg: 'bg-rose-500' },
  { key: 'slate', label: 'Xám', bg: 'bg-slate-500' },
];

export const NoteModal: React.FC<NoteModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [type, setType] = useState<NoteType>('note');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Cá nhân');
  const [color, setColor] = useState<NoteColor>('emerald');
  const [priority, setPriority] = useState<NotePriority>('medium');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [dueDate, setDueDate] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [subtasks, setSubtasks] = useState<SubTask[]>([]);
  const [subtaskInput, setSubtaskInput] = useState('');
  const [isPinned, setIsPinned] = useState(false);

  useEffect(() => {
    if (initialData) {
      setType(initialData.type);
      setTitle(initialData.title);
      setContent(initialData.content);
      setCategory(initialData.category || 'Cá nhân');
      setColor(initialData.color || 'emerald');
      setPriority(initialData.priority || 'medium');
      setStatus(initialData.status || 'todo');
      setDueDate(initialData.dueDate ? initialData.dueDate.split('T')[0] : '');
      setTags(initialData.tags || []);
      setSubtasks(initialData.subtasks || []);
      setSubtaskInput('');
      setIsPinned(initialData.isPinned || false);
    } else {
      setType('note');
      setTitle('');
      setContent('');
      setCategory('Cá nhân');
      setColor('emerald');
      setPriority('medium');
      setStatus('todo');
      setDueDate('');
      setTags([]);
      setSubtasks([]);
      setSubtaskInput('');
      setIsPinned(false);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleAddSubtask = (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e && 'key' in e && e.key !== 'Enter') return;
    if (e) e.preventDefault();
    if (!subtaskInput.trim()) return;
    setSubtasks([
      ...subtasks,
      {
        id: `st-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title: subtaskInput.trim(),
        completed: false,
      },
    ]);
    setSubtaskInput('');
  };

  const handleToggleSubtaskInModal = (id: string) => {
    setSubtasks(
      subtasks.map((st) => (st.id === id ? { ...st, completed: !st.completed } : st))
    );
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks(subtasks.filter((st) => st.id !== id));
  };

  const completedSubtasksCount = subtasks.filter((st) => st.completed).length;
  const subtasksPercent =
    subtasks.length > 0 ? Math.round((completedSubtasksCount / subtasks.length) * 100) : 0;

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    let finalSubtasks = type === 'task' ? [...subtasks] : [];
    if (type === 'task' && finalSubtasks.length === 0 && content.trim()) {
      const lines = content
        .split('\n')
        .map((l) => l.trim().replace(/^[-*•\d+\.]\s*/, ''))
        .filter(Boolean);
      if (lines.length > 0) {
        finalSubtasks = lines.map((line, idx) => ({
          id: `st-${Date.now()}-${idx}`,
          title: line,
          completed: false,
        }));
      }
    }

    onSubmit({
      type,
      title: title.trim(),
      content: content.trim(),
      category: category.trim() || 'Khác',
      color,
      isPinned,
      priority,
      status: type === 'task' ? status : undefined,
      dueDate: type === 'task' && dueDate ? dueDate : undefined,
      tags,
      subtasks: finalSubtasks,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md">
              {type === 'task' ? <CheckSquare className="w-5 h-5" /> : <StickyNote className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {initialData ? 'Chỉnh sửa' : 'Thêm mới'}{' '}
                {type === 'task' ? 'Công việc (Task)' : 'Ghi chú cá nhân'}
              </h2>
              <p className="text-xs text-slate-500">Lưu lại suy nghĩ và theo dõi tiến độ công việc</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body form */}
        <form onSubmit={handleSubmitForm} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Type switcher */}
          <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setType('note')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-lg transition-all ${
                type === 'note'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <StickyNote className="w-4 h-4" />
              Ghi chú cá nhân
            </button>
            <button
              type="button"
              onClick={() => setType('task')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-lg transition-all ${
                type === 'task'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              Công việc (Task)
            </button>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Tiêu đề <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={type === 'task' ? 'Nhập tên công việc cần làm...' : 'Nhập tiêu đề ghi chú...'}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Nội dung chi tiết
            </label>
            <textarea
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Nhập nội dung mô tả công việc..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none text-sm resize-none"
            />
          </div>

          {/* Subtasks / Checklist (Chỉ dành cho Task) */}
          {type === 'task' && (
            <div className="space-y-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <ListChecks className="w-4 h-4 text-emerald-500" />
                  Nhiệm vụ nhỏ (Checklist)
                </label>
                {subtasks.length > 0 && (
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                    {completedSubtasksCount}/{subtasks.length} ({subtasksPercent}%)
                  </span>
                )}
              </div>

              {/* Progress bar in modal */}
              {subtasks.length > 0 && (
                <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                    style={{ width: `${subtasksPercent}%` }}
                  />
                </div>
              )}

              {/* List of subtasks */}
              {subtasks.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {subtasks.map((st) => (
                    <div
                      key={st.id}
                      className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-sm shadow-sm"
                    >
                      <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={st.completed}
                          onChange={() => handleToggleSubtaskInModal(st.id)}
                          className="w-4 h-4 text-emerald-500 rounded focus:ring-emerald-500 border-slate-300"
                        />
                        <span
                          className={`truncate ${
                            st.completed
                              ? 'line-through text-slate-400 dark:text-slate-500'
                              : 'text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          {st.title}
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handleRemoveSubtask(st.id)}
                        className="p-1 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-500/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Subtask Input */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={subtaskInput}
                  onChange={(e) => setSubtaskInput(e.target.value)}
                  onKeyDown={handleAddSubtask}
                  placeholder="Nhập bước công việc nhỏ và ấn Enter..."
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddSubtask}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-500 text-white font-medium text-xs hover:bg-emerald-600 transition-colors shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Thêm
                </button>
              </div>
            </div>
          )}

          {/* Category & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Danh mục / Chủ đề
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="VD: Tài chính, Công việc..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Mức độ ưu tiên
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as NotePriority)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="low">Thấp</option>
                <option value="medium">Trung bình</option>
                <option value="high">Cao</option>
              </select>
            </div>
          </div>

          {/* Task fields: Status & Due Date */}
          {type === 'task' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Trạng thái công việc
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TaskStatus)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="todo">Cần làm</option>
                  <option value="in_progress">Đang thực hiện</option>
                  <option value="completed">Hoàn thành</option>
                  <option value="cancelled">Đã hủy</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Hạn hoàn thành (Due Date)
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>
          )}

          {/* Color theme selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Màu sắc thẻ
            </label>
            <div className="flex items-center gap-3">
              {colorOptions.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setColor(c.key)}
                  className={`w-7 h-7 rounded-full ${c.bg} transition-transform ${
                    color === c.key ? 'ring-4 ring-emerald-500/30 scale-110' : 'hover:scale-105 opacity-80'
                  }`}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Thẻ (Tags)
            </label>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium"
                >
                  <Tag className="w-3 h-3" />
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-rose-500 ml-0.5"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="Nhập thẻ và ấn Enter..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          {/* Pin option */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isPinned"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="w-4 h-4 text-emerald-500 rounded focus:ring-emerald-500 border-slate-300"
            />
            <label htmlFor="isPinned" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Ghim lên đầu trang
            </label>
          </div>

          {/* Submit buttons */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl font-medium text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl font-medium text-sm bg-gradient-to-r from-emerald-500 to-teal-400 text-white shadow-lg shadow-emerald-500/20 hover:opacity-95 transition-opacity"
            >
              {initialData ? 'Lưu thay đổi' : 'Tạo mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
