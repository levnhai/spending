import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { NoteItem, CreateNoteInput, UpdateNoteInput, TaskStatus } from './types';
import { noteApi } from '../noteApi';
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
  toggleSubtask: (noteId: string, subtaskId: string) => Promise<void>;
}

export const useNoteStore = create<NoteState>()(
  persist(
    (set, get) => ({
      notes: [],
      isLoading: false,
      error: null,

      fetchNotes: async () => {
        set({ isLoading: true, error: null });
        try {
          const data = await noteApi.getAll();
          set({ notes: data || [], isLoading: false });
        } catch (e: any) {
          console.warn('Không thể tải ghi chú/task từ API:', e?.message);
          set({ isLoading: false, error: e?.message || 'Lỗi kết nối server' });
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

      toggleSubtask: async (noteId, subtaskId) => {
        const targetNote = get().notes.find((n) => n.id === noteId);
        if (!targetNote) return;

        let currentSubtasks = targetNote.subtasks && targetNote.subtasks.length > 0 ? [...targetNote.subtasks] : [];

        // Nếu subtasks đang rỗng nhưng content có nhiều dòng, tự động tách content thành subtasks
        if (currentSubtasks.length === 0 && targetNote.content) {
          const lines = targetNote.content
            .split('\n')
            .map((l) => l.trim().replace(/^[-*•\d+\.]\s*/, ''))
            .filter(Boolean);
          if (lines.length > 0) {
            currentSubtasks = lines.map((l, idx) => ({
              id: `auto-${idx}`,
              title: l,
              completed: false,
            }));
          }
        }

        const updatedSubtasks = currentSubtasks.map((st, index) => {
          if (st.id === subtaskId || `auto-${index}` === subtaskId) {
            return { ...st, completed: !st.completed };
          }
          return st;
        });

        const total = updatedSubtasks.length;
        const completedCount = updatedSubtasks.filter((st) => st.completed).length;

        let newStatus = targetNote.status;
        if (total > 0 && completedCount === total) {
          newStatus = 'completed';
        } else if (completedCount > 0) {
          if (newStatus === 'todo' || newStatus === 'completed') {
            newStatus = 'in_progress';
          }
        } else if (completedCount === 0 && newStatus === 'in_progress') {
          newStatus = 'todo';
        }

        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === noteId
              ? {
                  ...n,
                  subtasks: updatedSubtasks,
                  status: newStatus,
                  updatedAt: new Date().toISOString(),
                }
              : n
          ),
        }));

        try {
          await noteApi.update(noteId, { subtasks: updatedSubtasks, status: newStatus });
        } catch (e) {
          console.warn('Toggle subtask offline:', e);
        }
      },
    }),
    {
      name: 'finflow-notes-storage-v2',
      partialize: (state) => ({ notes: state.notes }),
    }
  )
);
