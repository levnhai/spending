import {
  LayoutDashboard,
  Receipt,
  Wallet,
  Tag,
  PieChart,
  Target,
  FileSpreadsheet,
  PiggyBank,
  CalendarDays,
  StickyNote,
  ShoppingBag,
  Settings,
  ShieldCheck,
} from 'lucide-react';

export type UserRoleType = 'PERSONAL' | 'SALES' | 'ADMIN';

export interface MenuItemConfig {
  id: string;
  name: string;
  href: string;
  icon: any;
  category: 'core' | 'finance' | 'tools';
  group?: 'core' | 'finance' | 'tools';
  description?: string;
  isMandatory?: boolean; // Menu bắt buộc, không được ẩn
  allowedRoles?: UserRoleType[]; // Vai trò được phép xem menu này
}

export type NavItemConfig = MenuItemConfig;

export const APP_NAVIGATION_ITEMS: MenuItemConfig[] = [
  // Nhóm 1: Tính năng cốt lõi (Core)
  {
    id: 'dashboard',
    name: 'Tổng Quan',
    href: '/dashboard',
    icon: LayoutDashboard,
    category: 'core',
    group: 'core',
    description: 'Bảng điều khiển và thống kê dòng tiền tổng thể',
    isMandatory: true,
    allowedRoles: ['PERSONAL', 'SALES', 'ADMIN'],
  },
  {
    id: 'admin',
    name: 'Quản Trị Hệ Thống',
    href: '/admin',
    icon: ShieldCheck,
    category: 'core',
    group: 'core',
    description: 'Quản lý người dùng, phân quyền và giám sát hệ thống',
    isMandatory: true,
    allowedRoles: ['ADMIN'],
  },
  {
    id: 'orders',
    name: 'Quản Lý Đơn Hàng',
    href: '/orders',
    icon: ShoppingBag,
    category: 'core',
    group: 'core',
    description: 'Theo dõi đơn hàng, khách hàng, doanh số và công nợ',
    allowedRoles: ['SALES'],
  },
  {
    id: 'transactions',
    name: 'Sổ Giao Dịch',
    href: '/transactions',
    icon: Receipt,
    category: 'core',
    group: 'core',
    description: 'Quản lý lịch sử thu chi chi tiết',
    allowedRoles: ['PERSONAL'],
  },
  {
    id: 'wallets',
    name: 'Ví Tiền',
    href: '/wallets',
    icon: Wallet,
    category: 'core',
    group: 'core',
    description: 'Quản lý tài khoản ngân hàng, ví tiền mặt, thẻ tín dụng',
    allowedRoles: ['PERSONAL'],
  },

  // Nhóm 2: Quản lý tài chính & Kế hoạch (Finance)
  {
    id: 'categories',
    name: 'Danh Mục Thu Chi',
    href: '/categories',
    icon: Tag,
    category: 'finance',
    group: 'finance',
    description: 'Thiết lập danh mục phân loại thu nhập và chi tiêu',
    allowedRoles: ['PERSONAL'],
  },
  {
    id: 'budgets',
    name: 'Ngân Sách',
    href: '/budgets',
    icon: Target,
    category: 'finance',
    group: 'finance',
    description: 'Thiết lập hạn mức chi tiêu cho từng danh mục',
    allowedRoles: ['PERSONAL'],
  },
  {
    id: 'reports',
    name: 'Báo Cáo & Phân Tích',
    href: '/reports',
    icon: PieChart,
    category: 'finance',
    group: 'finance',
    description: 'Báo cáo trực quan và phân tích xu hướng thu chi',
    allowedRoles: ['PERSONAL'],
  },
  {
    id: 'savings',
    name: 'Mục Tiêu Tiết Kiệm',
    href: '/savings',
    icon: PiggyBank,
    category: 'finance',
    group: 'finance',
    description: 'Theo dõi tiến độ tích lũy tài chính và quỹ khẩn cấp',
    allowedRoles: ['PERSONAL'],
  },
  {
    id: 'bills',
    name: 'Hóa Đơn Định Kỳ',
    href: '/bills',
    icon: FileSpreadsheet,
    category: 'finance',
    group: 'finance',
    description: 'Nhắc nhở hóa đơn tiền điện, nước, internet hàng tháng',
    allowedRoles: ['PERSONAL'],
  },
  {
    id: 'monthly-plan',
    name: 'Kế Hoạch Tháng',
    href: '/monthly-plan',
    icon: CalendarDays,
    category: 'finance',
    group: 'finance',
    description: 'Lập dự toán thu chi chi tiết theo từng tháng',
    allowedRoles: ['PERSONAL'],
  },

  // Nhóm 3: Tiện ích & Cài đặt (Tools)
  {
    id: 'notes',
    name: 'Sổ Ghi Chú',
    href: '/notes',
    icon: StickyNote,
    category: 'tools',
    group: 'tools',
    description: 'Ghi chú tài chính và lưu trữ thông tin cần thiết',
    allowedRoles: ['PERSONAL', 'SALES', 'ADMIN'],
  },
  {
    id: 'settings',
    name: 'Cài Đặt Hệ Thống',
    href: '/settings',
    icon: Settings,
    category: 'tools',
    group: 'tools',
    description: 'Tùy biến menu, thông tin tài khoản và giao diện',
    isMandatory: true,
    allowedRoles: ['PERSONAL', 'SALES', 'ADMIN'],
  },
];

export const ALL_NAV_ITEMS = APP_NAVIGATION_ITEMS;

export const CATEGORY_LABELS: Record<string, string> = {
  core: 'Tính năng cốt lõi',
  finance: 'Tài chính cá nhân & Ngân sách',
  tools: 'Tiện ích & Thiết lập',
};

export const NAV_GROUPS: Record<string, string> = CATEGORY_LABELS;
