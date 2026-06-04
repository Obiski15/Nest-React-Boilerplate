import { BaseFilters } from '../common';
import { SubscribableNotificationEventType } from '../enums';

type BaseNotificationPreference = {
  email: boolean;
  whatsapp: boolean;
  sms: boolean;
};

export type NotificationPreferenceResponse = BaseNotificationPreference & {
  event_type: SubscribableNotificationEventType;
};

export type UpdateNotificationPreferenceRequest =
  Partial<BaseNotificationPreference> & {
    event_type: SubscribableNotificationEventType;
  };

export interface NotificationFilters extends BaseFilters {
  unreadOnly?: boolean;
}
