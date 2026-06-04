import { Injectable } from '@nestjs/common';

import {
  NotificationChannel,
  SubscribableNotificationEventType,
} from '@app/types';

import { UpdatePreferenceDto } from '../dtos/notification_preference.dto';
import { NotificationPreferenceRepository } from '../repository/notification_preference.repository';

@Injectable()
export class NotificationPreferenceService {
  constructor(
    private readonly notificationPreferenceRepo: NotificationPreferenceRepository,
  ) {}

  private readonly SYSTEM_DEFAULTS: Record<
    SubscribableNotificationEventType,
    NotificationChannel[]
  > = {
    [SubscribableNotificationEventType.PROMOTIONAL]: [
      NotificationChannel.EMAIL,
    ],
  };

  async getTargetChannelsForUser(
    user_id: string,
    event_type: SubscribableNotificationEventType,
  ): Promise<NotificationChannel[]> {
    const preference = await this.notificationPreferenceRepo.findOne({
      where: { user_id, event_type },
    });

    if (!preference) {
      return this.SYSTEM_DEFAULTS[event_type] || [];
    }

    const channels: NotificationChannel[] = [];
    if (preference.email) channels.push(NotificationChannel.EMAIL);
    if (preference.whatsapp) channels.push(NotificationChannel.WHATSAPP);
    if (preference.sms) channels.push(NotificationChannel.SMS);

    return channels;
  }

  async getUserPreferences(user_id: string) {
    const savedPreferences = await this.notificationPreferenceRepo.find({
      where: { user_id },
    });

    const preferences = Object.values(SubscribableNotificationEventType).map(
      (event_type) => {
        const saved = savedPreferences.find((p) => p.event_type === event_type);
        const defaultChannels = this.SYSTEM_DEFAULTS[event_type] || [];

        return {
          event_type,
          email: saved
            ? saved.email
            : defaultChannels.includes(NotificationChannel.EMAIL),
          whatsapp: saved
            ? saved.whatsapp
            : defaultChannels.includes(NotificationChannel.WHATSAPP),
          sms: saved
            ? saved.sms
            : defaultChannels.includes(NotificationChannel.SMS),
        };
      },
    );

    return { preferences };
  }

  async upsertPreference(user_id: string, dto: UpdatePreferenceDto) {
    await this.notificationPreferenceRepo.upsert(
      {
        user_id,
        ...dto,
      },
      ['user_id', 'event_type'],
    );
  }
}
