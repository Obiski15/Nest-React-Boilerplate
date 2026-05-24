import { UpdateUserRequest, UserFilters, UserRecord } from '@app/types';

import BaseService from './base.service';

class UserService extends BaseService {
  constructor() {
    super('/users');
  }

  getProfile() {
    return this.get<UserRecord>('/profile');
  }

  updateProfile(data: UpdateUserRequest) {
    return this.patch<UpdateUserRequest, UserRecord>('/profile', data);
  }

  deleteProfile() {
    return this.delete<void>('/profile');
  }

  getUsers(filters?: UserFilters) {
    return this.get<unknown>('', { params: filters });
  }

  getUserById(id: string) {
    return this.get<UserRecord>(`/${id}`);
  }

  updateUser(id: string, data: UpdateUserRequest) {
    return this.patch<UpdateUserRequest, UserRecord>(`/${id}`, data);
  }

  deleteUser(id: string) {
    return this.delete<void>(`/${id}`);
  }
}

export const userService = new UserService();
