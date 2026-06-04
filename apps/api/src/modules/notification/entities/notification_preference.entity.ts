import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';

import { SubscribableNotificationEventType } from '@app/types';

import BaseEntity from '../../../entities/base.entity';
import { UserEntity } from '../../user/entities/user.entity';

@Entity('notification_preferences')
@Unique(['user_id', 'event_type'])
export class NotificationPreferenceEntity extends BaseEntity {
  @Column()
  user_id: string;

  @Column({ type: 'enum', enum: SubscribableNotificationEventType })
  event_type: SubscribableNotificationEventType;

  @Column({ default: true })
  email: boolean;

  @Column({ default: false })
  whatsapp: boolean;

  @Column({ default: false })
  sms: boolean;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;
}
