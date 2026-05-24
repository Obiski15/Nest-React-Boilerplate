import { SortOrder, UserRole } from '../enums';

export type UserRecord = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  is_email_verified: boolean;
  is_two_factor_enabled: boolean;
  created_at: string | Date;
  updated_at: string | Date;
};

export type UserFilters = {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: keyof UserRecord;
  sortOrder?: SortOrder;
  role?: UserRole;
  is_active?: boolean;
  is_email_verified?: boolean;
};

export type UpdateUserRequest = {
  name?: string;
  email?: string;
};

export type AdminUpdateUserRequest = UpdateUserRequest & {
  role?: UserRole;
  is_active?: boolean;
};
