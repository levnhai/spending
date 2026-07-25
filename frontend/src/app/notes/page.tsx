import { NotesView } from '@/views/notes';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ghi chú & Công việc | FinFlow',
  description: 'Ghi chú cá nhân và quản lý tiến độ công việc',
};

export default function NotesPage() {
  return <NotesView />;
}
