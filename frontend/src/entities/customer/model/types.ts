import { Order } from "@/entities/order";

export type CustomerGroupType =
  | "VIP"
  | "REGULAR"
  | "WHOLESALE"
  | "RETAIL"
  | "BAD_DEBT";

export interface Customer {
  _id: string;
  userId: string;
  name: string;
  phone?: string;
  facebookUrl?: string;
  zaloPhone?: string;
  address?: string;
  group: CustomerGroupType;
  tags?: string[];
  note?: string;
  totalSpent: number;
  totalOrders: number;
  debtAmount: number;
  lastOrderDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerWithOrders {
  customer: Customer;
  relatedOrders: Order[];
}

export interface CustomerStats {
  totalCustomers: number;
  totalDebt: number;
  debtorsCount: number;
  totalSpent: number;
  groupCounts: Record<string, number>;
  topVipCustomers: Customer[];
  topDebtors: Customer[];
}

export interface CreateCustomerPayload {
  name: string;
  phone?: string;
  facebookUrl?: string;
  zaloPhone?: string;
  address?: string;
  group?: CustomerGroupType;
  tags?: string[];
  note?: string;
}

export interface UpdateCustomerPayload extends Partial<CreateCustomerPayload> {}

export const CUSTOMER_GROUP_CONFIG: Record<
  CustomerGroupType,
  { label: string; color: string; bg: string; text: string; border: string }
> = {
  VIP: {
    label: "VIP",
    color: "#EAB308",
    bg: "bg-amber-50 dark:bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-500/20",
  },
  REGULAR: {
    label: "Quen",
    color: "#3B82F6",
    bg: "bg-blue-50 dark:bg-blue-500/10",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-500/20",
  },
  WHOLESALE: {
    label: "Sỉ",
    color: "#8B5CF6",
    bg: "bg-purple-50 dark:bg-purple-500/10",
    text: "text-purple-600 dark:text-purple-400",
    border: "border-purple-200 dark:border-purple-500/20",
  },
  RETAIL: {
    label: "Lẻ",
    color: "#10B981",
    bg: "bg-emerald-50 dark:bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-500/20",
  },
  BAD_DEBT: {
    label: "Nợ xấu",
    color: "#EF4444",
    bg: "bg-rose-50 dark:bg-rose-500/10",
    text: "text-rose-600 dark:text-rose-400",
    border: "border-rose-200 dark:border-rose-500/20",
  },
};
