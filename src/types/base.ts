// Base types used across the application

export type Role = "admin" | "executive" | "owner" | "approver" | "reviewer";

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface User extends BaseEntity {
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
}

export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  success: boolean;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SortParam {
  field: string;
  direction: "asc" | "desc";
}

export interface DateRange {
  start: string;
  end: string;
}

export interface ListParams<TFilter = Record<string, unknown>> {
  page?: number;
  pageSize?: number;
  sort?: SortParam;
  search?: string;
  filters?: TFilter;
}
