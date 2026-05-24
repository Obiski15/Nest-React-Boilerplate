import { Exclude } from 'class-transformer';
import { Column, DeleteDateColumn, Entity, Index } from 'typeorm';

import { UserRole } from '@app/types';

import BaseEntity from '../../../entities/base.entity';

@Entity('users')
export class UserEntity extends BaseEntity {
  @Index()
  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Exclude()
  @Column({ type: 'varchar', length: 255, select: false })
  password: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({ type: 'boolean', default: false })
  is_email_verified: boolean;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Exclude()
  @DeleteDateColumn({
    type: 'timestamp with time zone',
    nullable: true,
  })
  deletedAt: Date;

  @Column({ type: 'boolean', default: false })
  is_two_factor_enabled: boolean;

  @Exclude()
  @Column({ type: 'varchar', nullable: true, select: false })
  two_factor_secret: string | null;

  @Exclude()
  @Column({ type: 'text', array: true, default: [], select: false })
  two_factor_recovery_codes: string[];
}
