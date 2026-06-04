import {
  NotificationPreferenceResponse,
  UpdateNotificationPreferenceRequest,
} from '@app/types';

import BaseService from './base.service';

class NotificationServiceError extends BaseService {
  constructor() {
    super('/notifications');
  }

  async getPreferences() {
    return this.get<{
      preferences: NotificationPreferenceResponse[];
    }>('/preferences');
  }

  async updatePreference(updateData: UpdateNotificationPreferenceRequest) {
    return this.put<UpdateNotificationPreferenceRequest, unknown>(
      '/preferences',
      updateData,
    );
  }
}

export const notificationService = new NotificationServiceError();
