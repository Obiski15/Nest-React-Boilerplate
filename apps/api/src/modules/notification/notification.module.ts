import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserModule } from '../user/user.module';
import { NotificationPreferenceController } from './controllers/notification_preference.controller';
import { NotificationPreferenceEntity } from './entities/notification_preference.entity';
import {
  EMAIL_QUEUE,
  SMS_QUEUE,
  WHATSAPP_QUEUE,
} from './enums/notification.enum';
import { MailProcessor } from './processors/mail.processor';
import { NotificationPreferenceRepository } from './repository/notification_preference.repository';
import { NotificationPreferenceService } from './services/notification_preference.service';
import { NotificationService } from './services/notification.service';

@Module({
  imports: [
    UserModule,
    TypeOrmModule.forFeature([NotificationPreferenceEntity]),
    BullModule.registerQueue(
      {
        name: EMAIL_QUEUE,
      },
      {
        name: WHATSAPP_QUEUE,
      },
      {
        name: SMS_QUEUE,
      },
    ),
  ],
  controllers: [NotificationPreferenceController],
  providers: [
    NotificationPreferenceService,
    NotificationPreferenceRepository,
    NotificationService,
    MailProcessor,
  ],
  exports: [NotificationService, NotificationPreferenceService],
})
export class NotificationModule {}
