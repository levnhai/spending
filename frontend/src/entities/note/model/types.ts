export type NoteType = 'note' | 'task';

export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'cancelled';

export type NotePriority = 'low' | 'medium' | 'high';

export type NoteColor = 'emerald' | 'blue' | 'amber' | 'purple' | 'rose' | 'slate';

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface NoteItem {
  id: string;
  type: NoteType;
  title: string;
  content: string;
  category: string;
  color: NoteColor;
  isPinned: boolean;
  priority: NotePriority;
  status?: TaskStatus; // chỉ dùng khi type === 'task'
  dueDate?: string;     // Ngày hạn hoàn thành (YYYY-MM-DD)
  completedAt?: string; // Ngày giờ thực tế hoàn thành
  tags: string[];
  subtasks?: SubTask[]; // Danh sách các nhiệm vụ nhỏ chia theo checklist
  createdAt: string;
  updatedAt: string;
}

export type CreateNoteInput = Omit<NoteItem, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateNoteInput = Partial<CreateNoteInput>;
