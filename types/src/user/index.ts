import { BaseFilters } from '../common';
import { UserRole } from '../enums';

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

export interface UserFilters extends BaseFilters {
  sortBy?: keyof UserRecord;
  role?: UserRole;
  is_active?: boolean;
  is_email_verified?: boolean;
}

export type UpdateUserRequest = {
  name?: string;
  email?: string;
};

export type AdminUpdateUserRequest = UpdateUserRequest & {
  role?: UserRole;
  is_active?: boolean;
};
