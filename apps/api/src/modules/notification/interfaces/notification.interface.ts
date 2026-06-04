import {
  NotificationChannel,
  SubscribableNotificationEventType,
} from '@app/types';

import {
  NotificationTitle,
  TransactionalNotificationEventType,
} from '../enums/notification.enum';

// shared properties
interface BaseNotificationPayload<
  T extends Record<string, unknown> = Record<string, unknown>,
> {
  user_id: string;
  title: NotificationTitle;
  message: string;
  metadata?: T;
}

export interface ITransactionalPayload<
  T extends Record<string, unknown> = Record<string, unknown>,
> extends BaseNotificationPayload<T> {
  event_type: TransactionalNotificationEventType;
  override_channels: NotificationChannel[];
}

export interface ISubscribablePayload<
  T extends Record<string, unknown> = Record<string, unknown>,
> extends BaseNotificationPayload<T> {
  event_type: SubscribableNotificationEventType;
  override_channels?: never;
}

export type INotificationPayload<
  T extends Record<string, unknown> = Record<string, unknown>,
> = ITransactionalPayload<T> | ISubscribablePayload<T>;

export interface EmailQueuePayload {
  to: string;
  subject: string;
  message: string;
}
