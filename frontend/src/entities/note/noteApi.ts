import { api } from '@/shared/lib/api';
import { NoteItem, CreateNoteInput, UpdateNoteInput, TaskStatus } from './model/types';

export const noteApi = {
  getAll: async (): Promise<NoteItem[]> => {
    const res = await api.get('/notes');
    return res.data.map((item: any) => ({
      ...item,
      id: item._id || item.id,
    }));
  },

  create: async (data: CreateNoteInput): Promise<NoteItem> => {
    const res = await api.post('/notes', data);
    return {
      ...res.data,
      id: res.data._id || res.data.id,
    };
  },

  update: async (id: string, data: UpdateNoteInput): Promise<NoteItem> => {
    const res = await api.put(`/notes/${id}`, data);
    return {
      ...res.data,
      id: res.data._id || res.data.id,
    };
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/notes/${id}`);
  },

  togglePin: async (id: string): Promise<NoteItem> => {
    const res = await api.patch(`/notes/${id}/pin`);
    return {
      ...res.data,
      id: res.data._id || res.data.id,
    };
  },

  updateStatus: async (id: string, status: TaskStatus): Promise<NoteItem> => {
    const res = await api.patch(`/notes/${id}/status`, { status });
    return {
      ...res.data,
      id: res.data._id || res.data.id,
    };
  },
};
