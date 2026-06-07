export enum UserRole {
  CUSTOMER = 'customer',
  ADMIN = 'admin',
}

export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export type ProductBadge = 'HOT' | 'SALE' | 'MỚI' | '';

export interface JwtPayload {
  /** User primary key */
  sub: number;
  email: string;
  role: UserRole;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
