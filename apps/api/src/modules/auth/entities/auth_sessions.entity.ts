import { IsNotEmpty, IsString } from 'class-validator';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import BaseEntity from '../../../entities/base.entity';
import { UserEntity } from '../../user/entities/user.entity';

@Entity('auth_sessions')
export class AuthSessionsEntity extends BaseEntity {
  @IsString()
  @IsNotEmpty()
  @Column({ nullable: false })
  refresh_token: string;

  @ManyToOne(() => UserEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;
}
