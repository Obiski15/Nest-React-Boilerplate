import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { BaseRepository } from '../../../repository/base.repository';
import { NotificationPreferenceEntity } from '../entities/notification_preference.entity';

@Injectable()
export class NotificationPreferenceRepository extends BaseRepository<NotificationPreferenceEntity> {
  constructor(dataSource: DataSource) {
    super(NotificationPreferenceEntity, dataSource);
  }
}
