import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';

import { DeviceMetadata } from '@app/types';

import BaseEntity from '../../../entities/base.entity';
import { UserEntity } from '../../user/entities/user.entity';

@Entity('auth_sessions')
@Unique(['user_id', 'device_id'])
export class AuthSessionsEntity extends BaseEntity {
  @IsString()
  @IsNotEmpty()
  @Column({ nullable: false })
  refresh_token: string;

  @IsString()
  @IsNotEmpty()
  @Column({ nullable: false })
  device_id: string;

  @IsOptional()
  @Column({ type: 'jsonb', nullable: true })
  metadata?: DeviceMetadata;

  @Column()
  user_id: string;

  @ManyToOne(() => UserEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;
}
