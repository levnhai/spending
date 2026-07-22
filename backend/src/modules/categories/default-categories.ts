import { CategoryType } from '../../schemas/category.schema';

export const DEFAULT_CATEGORIES = [
  // Thu nhập
  { name: 'Lương', type: CategoryType.INCOME, icon: 'Banknote', color: '#10B981', isSystem: true },
  { name: 'Thưởng', type: CategoryType.INCOME, icon: 'Gift', color: '#059669', isSystem: true },
  { name: 'Freelance', type: CategoryType.INCOME, icon: 'Laptop', color: '#3B82F6', isSystem: true },
  { name: 'Đầu tư', type: CategoryType.INCOME, icon: 'TrendingUp', color: '#8B5CF6', isSystem: true },
  { name: 'Thu nhập khác', type: CategoryType.INCOME, icon: 'PlusCircle', color: '#6B7280', isSystem: true },

  // Chi tiêu
  { name: 'Ăn uống', type: CategoryType.EXPENSE, icon: 'Utensils', color: '#F43F5E', isSystem: true },
  { name: 'Cafe', type: CategoryType.EXPENSE, icon: 'Coffee', color: '#F97316', isSystem: true },
  { name: 'Mua sắm', type: CategoryType.EXPENSE, icon: 'ShoppingBag', color: '#EC4899', isSystem: true },
  { name: 'Đi lại', type: CategoryType.EXPENSE, icon: 'Car', color: '#EAB308', isSystem: true },
  { name: 'Hóa đơn', type: CategoryType.EXPENSE, icon: 'Receipt', color: '#6366F1', isSystem: true },
  { name: 'Giải trí', type: CategoryType.EXPENSE, icon: 'Gamepad2', color: '#A855F7', isSystem: true },
  { name: 'Y tế', type: CategoryType.EXPENSE, icon: 'Stethoscope', color: '#06B6D4', isSystem: true },
  { name: 'Giáo dục', type: CategoryType.EXPENSE, icon: 'GraduationCap', color: '#14B8A6', isSystem: true },
];
