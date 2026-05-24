export const MAIL_QUEUE_NAME = 'email-queue';

export enum MailJobName {
  SEND_VERIFICATION = 'send-verification',
  SEND_PASSWORD_RESET = 'send-password-reset',
  SEND_WELCOME = 'send-welcome',
}
