import { SubscribableNotificationEventType } from '@app/types';

export const WHATSAPP_QUEUE = 'whatsapp_queue';
export const EMAIL_QUEUE = 'email_queue';
export const SMS_QUEUE = 'sms_queue';

export enum NotificationTitle {
  TWO_FACTOR_ENABLED = 'Two-Factor Authentication Enabled',
  TWO_FACTOR_DISABLED = 'Two-Factor Authentication Disabled',
  PROMOTIONAL = 'New Promotional Offer Just for You!',
  WELCOME_MESSAGE = 'Welcome to Our Service!',
  EMAIL_VERIFICATION = 'Email Verification',
  PASSWORD_RESET = 'Password Reset Request',
  PASSWORD_CHANGE = 'Password Changed',
  LOGIN_ALERT = 'New Login Alert',
}

export enum TransactionalNotificationEventType {
  TWO_FACTOR_DISABLED = 'two_factor_disabled',
  TWO_FACTOR_ENABLED = 'two_factor_enabled',
  EMAIL_VERIFICATION = 'email_verification',
  PASSWORD_CHANGE = 'password_change',
  WELCOME_MESSAGE = 'welcome_message',
  PASSWORD_RESET = 'password_reset',
  LOGIN_ALERT = 'login_alert',
}

export const NotificationEventType = {
  ...TransactionalNotificationEventType,
  ...SubscribableNotificationEventType,
} as const;

export type NotificationEventType =
  (typeof NotificationEventType)[keyof typeof NotificationEventType];
