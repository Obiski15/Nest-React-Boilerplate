import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

import { NotificationChannel } from '@app/types';

import { AppLogger } from '../../../common/logger/logger.service';
import { LOG_EVENTS } from '../../../constants/log_events';
import { LOG_MESSAGES } from '../../../constants/log_messages';
import { UserService } from '../../user/services/user.service';
import { EMAIL_QUEUE, WHATSAPP_QUEUE } from '../enums/notification.enum';
import { INotificationPayload } from '../interfaces/notification.interface';
import { NotificationPreferenceService } from './notification_preference.service';

@Injectable()
export class NotificationService {
  constructor(
    private readonly preferenceService: NotificationPreferenceService,
    @InjectQueue(WHATSAPP_QUEUE) private readonly whatsappQueue: Queue,
    @InjectQueue(EMAIL_QUEUE) private readonly emailQueue: Queue,
    private readonly userService: UserService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(NotificationService.name);
  }

  async dispatch<T extends Record<string, unknown>>(
    payload: INotificationPayload<T>,
  ) {
    try {
      const user = await this.userService.getById({ id: payload.user_id });
      if (!user) return;

      const targetChannels =
        payload.override_channels ||
        (await this.preferenceService.getTargetChannelsForUser(
          user.id,
          payload.event_type,
        ));

      const dispatchPromises: Promise<unknown>[] = [];

      if (targetChannels.includes(NotificationChannel.EMAIL)) {
        dispatchPromises.push(this.queueEmail<T>(user.email, payload));
      }

      if (
        targetChannels.includes(NotificationChannel.WHATSAPP) &&
        user.phone_number
      ) {
        dispatchPromises.push(
          this.queueWhatsApp<T>(user.phone_number, payload),
        );
      }

      // Execute all non-blocking dispatches in parallel
      await Promise.allSettled(dispatchPromises);

      this.logger.log(
        LOG_MESSAGES.NOTIFICATION.DISPATCHED(payload.event_type, user.id),
        {
          event: LOG_EVENTS.NOTIFICATION_DISPATCHED,
        },
      );
    } catch (error) {
      this.logger.error(
        LOG_MESSAGES.NOTIFICATION.DISPATCH_FAILED(payload.user_id),
        {
          event: LOG_EVENTS.NOTIFICATION_DISPATCH_FAILED,
        },
        (error as Error).stack,
      );
    }
  }

  private async queueEmail<T extends Record<string, unknown>>(
    to: string,
    payload: INotificationPayload<T>,
  ) {
    await this.emailQueue.add(
      payload.event_type,
      {
        to,
        message: payload.message,
        subject: payload.title,
        context: payload.metadata,
      },
      {
        removeOnComplete: true,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      },
    );
  }

  private async queueWhatsApp<T extends Record<string, unknown>>(
    phone: string,
    payload: INotificationPayload<T>,
  ) {
    await this.whatsappQueue.add(
      payload.event_type,
      {
        to: phone,
        message: payload.message,
        metadata: payload.metadata,
      },
      {
        removeOnComplete: true,
        attempts: 5,
      },
    );
  }
}
