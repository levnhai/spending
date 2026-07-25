import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { NoteItem, CreateNoteInput, UpdateNoteInput, TaskStatus } from './types';
import { noteApi } from '../noteApi';

const now = new Date();
const todayStr = now.toISOString().split('T')[0];

const INITIAL_FALLBACK_NOTES: NoteItem[] = [
  {
    id: 'note-1',
    type: 'note',
    title: 'Ghi chú tài khoản & Dịch vụ cá nhân',
    content: '- Spotify Family: Hạn gia hạn ngày 15 hàng tháng\n- Tiền thuê nhà: Chuyển trước ngày 05 hàng tháng\n- Bảo hiểm sức khỏe: Cần gửi hồ sơ hoàn ứng tháng này',
    category: 'Cá nhân',
    color: 'emerald',
    isPinned: true,
    priority: 'high',
    tags: ['Tài khoản', 'Định kỳ'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task-1',
    type: 'task',
    title: 'Nộp báo cáo tài chính quý 3',
    content: 'Tổng hợp số liệu chi tiêu các danh mục và chuẩn bị tài liệu họp ban điều hành.',
    category: 'Công việc',
    color: 'blue',
    isPinned: true,
    priority: 'high',
    status: 'in_progress',
    dueDate: todayStr,
    tags: ['Báo cáo', 'Tài chính'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task-2',
    type: 'task',
    title: 'Xây dựng tính năng theo dõi danh mục tài sản',
    content: 'Tích hợp thêm tính năng theo dõi cổ phiếu, vàng và tiết kiệm tích lũy vào FinFlow.',
    category: 'Dự án',
    color: 'amber',
    isPinned: false,
    priority: 'medium',
    status: 'todo',
    dueDate: '2026-07-28',
    tags: ['FinFlow', 'Dev'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task-3',
    type: 'task',
    title: 'Thanh toán tiền điện thoại & Internet',
    content: 'Hạn thanh toán trước ngày 26 hàng tháng để không bị gián đoạn dịch vụ.',
    category: 'Cá nhân',
    color: 'rose',
    isPinned: false,
    priority: 'medium',
    status: 'completed',
    dueDate: todayStr,
    completedAt: new Date().toISOString(),
    tags: ['Hóa đơn', 'Gia đình'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'note-2',
    type: 'note',
    title: 'Danh sách sách cần đọc Q3/2026',
    content: '1. The Psychology of Money - Morgan Housel\n2. Atomic Habits - James Clear\n3. Designing Data-Intensive Applications',
    category: 'Cá nhân',
    color: 'purple',
    isPinned: false,
    priority: 'low',
    tags: ['Sách', 'Phát triển bản thân'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

interface NoteState {
  notes: NoteItem[];
  isLoading: boolean;
  error: string | null;
  fetchNotes: () => Promise<void>;
  addNote: (input: CreateNoteInput) => Promise<void>;
  updateNote: (id: string, input: UpdateNoteInput) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  togglePin: (id: string) => Promise<void>;
  updateTaskStatus: (id: string, status: TaskStatus) => Promise<void>;
}

export const useNoteStore = create<NoteState>()(
  persist(
    (set, get) => ({
      notes: INITIAL_FALLBACK_NOTES,
      isLoading: false,
      error: null,

      fetchNotes: async () => {
        set({ isLoading: true, error: null });
        try {
          const data = await noteApi.getAll();
          if (data && data.length > 0) {
            set({ notes: data, isLoading: false });
          } else {
            set({ isLoading: false });
          }
        } catch (e: any) {
          console.warn('Không thể kết nối API Backend, dùng cache local:', e?.message);
          set({ isLoading: false });
        }
      },

      addNote: async (input) => {
        const tempId = `temp-${Date.now()}`;
        const tempNote: NoteItem = {
          ...input,
          id: tempId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({ notes: [tempNote, ...state.notes] }));

        try {
          const created = await noteApi.create(input);
          set((state) => ({
            notes: state.notes.map((n) => (n.id === tempId ? created : n)),
          }));
        } catch (e) {
          console.warn('Tạo ghi chú/task offline:', e);
        }
      },

      updateNote: async (id, input) => {
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === id ? { ...n, ...input, updatedAt: new Date().toISOString() } : n
          ),
        }));

        try {
          await noteApi.update(id, input);
        } catch (e) {
          console.warn('Lưu ghi chú/task offline:', e);
        }
      },

      deleteNote: async (id) => {
        set((state) => ({
          notes: state.notes.filter((n) => n.id !== id),
        }));

        try {
          await noteApi.delete(id);
        } catch (e) {
          console.warn('Xóa ghi chú/task offline:', e);
        }
      },

      togglePin: async (id) => {
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === id ? { ...n, isPinned: !n.isPinned } : n
          ),
        }));

        try {
          await noteApi.togglePin(id);
        } catch (e) {
          console.warn('Toggle pin offline:', e);
        }
      },

      updateTaskStatus: async (id, status) => {
        const isCompleted = status === 'completed';
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === id
              ? {
                  ...n,
                  status,
                  completedAt: isCompleted ? new Date().toISOString() : undefined,
                  updatedAt: new Date().toISOString(),
                }
              : n
          ),
        }));

        try {
          await noteApi.updateStatus(id, status);
        } catch (e) {
          console.warn('Cập nhật trạng thái offline:', e);
        }
      },
    }),
    {
      name: 'finflow-notes-storage',
      partialize: (state) => ({ notes: state.notes }),
    }
  )
);
