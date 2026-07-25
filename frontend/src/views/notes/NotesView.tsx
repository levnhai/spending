'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { StickyNote, CheckSquare, Pin, BookOpen, CheckCircle2, FileText, Plus, BarChart2 } from 'lucide-react';
import { Header } from '@/widgets/header/Header';
import { useNoteStore, NoteItem, TaskStatus, CreateNoteInput } from '@/entities/note';
import { NoteCard } from '@/entities/note';
import { NoteFilters, NoteModal, TaskProgressChart } from '@/features/note-management';

export const NotesView: React.FC = () => {
  const { notes, fetchNotes, addNote, updateNote, deleteNote, togglePin, updateTaskStatus } = useNoteStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'note' | 'task'>('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCharts, setShowCharts] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteItem | null>(null);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    notes.forEach((n) => {
      if (n.category) set.add(n.category);
    });
    return Array.from(set);
  }, [notes]);

  // Statistics
  const totalNotesCount = notes.filter((n) => n.type === 'note').length;
  const totalTasksCount = notes.filter((n) => n.type === 'task').length;
  const completedTasksCount = notes.filter((n) => n.type === 'task' && n.status === 'completed').length;
  const pinnedCount = notes.filter((n) => n.isPinned).length;

  // Filtered notes & tasks
  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      // Filter tab
      if (activeTab !== 'all' && note.type !== activeTab) return false;

      // Filter category
      if (selectedCategory !== 'all' && note.category !== selectedCategory) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = note.title.toLowerCase().includes(q);
        const matchContent = note.content.toLowerCase().includes(q);
        const matchCategory = note.category.toLowerCase().includes(q);
        const matchTags = note.tags.some((t) => t.toLowerCase().includes(q));
        return matchTitle || matchContent || matchCategory || matchTags;
      }

      return true;
    });
  }, [notes, activeTab, selectedCategory, searchQuery]);

  const pinnedNotes = useMemo(() => filteredNotes.filter((n) => n.isPinned), [filteredNotes]);
  const otherNotes = useMemo(() => filteredNotes.filter((n) => !n.isPinned), [filteredNotes]);

  const handleOpenCreate = () => {
    setEditingNote(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (note: NoteItem) => {
    setEditingNote(note);
    setIsModalOpen(true);
  };

  const handleSubmitModal = (data: CreateNoteInput) => {
    if (editingNote) {
      updateNote(editingNote.id, data);
    } else {
      addNote(data);
    }
  };

  return (
    <div className="min-h-screen pb-20 md:pb-8 space-y-6">
      {/* Universal Header Bar */}
      <Header title="Ghi chú & Quản lý Công việc" onOpenQuickAdd={handleOpenCreate} />

      {/* Main Content Area with proper padding */}
      <main className="px-4 md:px-8 space-y-8 max-w-[1600px] mx-auto">
        {/* Banner Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 p-6 md:p-8 text-white shadow-2xl border border-slate-800/80">
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2.5 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold border border-blue-500/30">
                <CheckSquare className="w-4 h-4 text-blue-400" />
                Quản lý công việc & Theo dõi tiến độ
              </div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight">
                Không gian Ghi chú & Tiến độ Công việc (Tasks)
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed">
                Quản lý checklist công việc hàng ngày, lập kế hoạch hoàn thành theo ngày/tháng và theo dõi biểu đồ hoàn thành trực quan.
              </p>
            </div>

            {/* Quick Stats Badges */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex-1 min-w-[120px] bg-slate-800/60 backdrop-blur-md border border-slate-700/60 px-4 py-3 rounded-2xl flex items-center gap-3 shadow-lg">
                <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 shadow-inner">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-medium block">Ghi chú</span>
                  <span className="text-xl font-black text-white">{totalNotesCount}</span>
                </div>
              </div>

              <div className="flex-1 min-w-[120px] bg-slate-800/60 backdrop-blur-md border border-slate-700/60 px-4 py-3 rounded-2xl flex items-center gap-3 shadow-lg">
                <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 shadow-inner">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-medium block">Tổng Tasks</span>
                  <span className="text-xl font-black text-white">{totalTasksCount}</span>
                </div>
              </div>

              <div className="flex-1 min-w-[120px] bg-slate-800/60 backdrop-blur-md border border-slate-700/60 px-4 py-3 rounded-2xl flex items-center gap-3 shadow-lg">
                <div className="p-2.5 rounded-xl bg-teal-500/20 text-teal-400 shadow-inner">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-medium block">Đã hoàn thành</span>
                  <span className="text-xl font-black text-white">{completedTasksCount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Decorative Glow Elements */}
          <div className="absolute -right-12 -bottom-12 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute right-60 -top-12 w-56 h-56 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        </div>

        {/* Toggle Charts & Statistics Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-emerald-500" />
              Thống kê tiến độ công việc
            </h2>
            <button
              onClick={() => setShowCharts(!showCharts)}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              {showCharts ? 'Ẩn biểu đồ' : 'Hiện biểu đồ'}
            </button>
          </div>

          {showCharts && <TaskProgressChart notes={notes} />}
        </section>

        {/* Toolbar & Filters */}
        <div className="bg-white dark:bg-slate-900 p-4 md:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <NoteFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            categories={categories}
            onOpenCreateModal={handleOpenCreate}
          />
        </div>

        {/* Pinned Section */}
        {pinnedNotes.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2.5 text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
                <Pin className="w-4 h-4 fill-amber-500" />
              </div>
              <span>MỤC ĐÃ GHIM ({pinnedNotes.length})</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
              {pinnedNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onEdit={handleOpenEdit}
                  onDelete={deleteNote}
                  onTogglePin={togglePin}
                  onStatusChange={updateTaskStatus}
                />
              ))}
            </div>
          </section>
        )}

        {/* Regular Notes & Tasks Section */}
        <section className="space-y-4">
          {pinnedNotes.length > 0 && otherNotes.length > 0 && (
            <div className="flex items-center gap-2.5 text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider pt-4">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                <BookOpen className="w-4 h-4" />
              </div>
              <span>TẤT CẢ DỮ LIỆU KHÁC ({otherNotes.length})</span>
            </div>
          )}

          {filteredNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900/60 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shadow-inner">
                <StickyNote className="w-8 h-8" />
              </div>
              <div className="space-y-1.5 max-w-md">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Không tìm thấy ghi chú hoặc công việc phù hợp
                </h3>
                <p className="text-xs text-slate-500">
                  {searchQuery
                    ? 'Thử thay đổi từ khóa tìm kiếm hoặc chọn lại danh mục khác.'
                    : 'Hãy tạo mới ghi chú hoặc task công việc đầu tiên của bạn ngay!'}
                </p>
              </div>
              <button
                onClick={handleOpenCreate}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-white font-semibold text-sm shadow-lg shadow-emerald-500/20 hover:opacity-95 transition-opacity"
              >
                <Plus className="w-4 h-4" />
                Tạo mới ngay
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
              {(pinnedNotes.length > 0 ? otherNotes : filteredNotes).map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onEdit={handleOpenEdit}
                  onDelete={deleteNote}
                  onTogglePin={togglePin}
                  onStatusChange={updateTaskStatus}
                />
              ))}
            </div>
          )}
        </section>

        {/* Note/Task Editor Modal */}
        <NoteModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSubmitModal}
          initialData={editingNote}
        />
      </main>
    </div>
  );
};
