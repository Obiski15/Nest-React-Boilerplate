import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import BaseEntity from '../../../entities/base.entity';
import { UserEntity } from '../../user/entities/user.entity';
import { TokenType } from '../enums/auth_token.enum';

@Entity('auth_tokens')
export class AuthTokenEntity extends BaseEntity {
  @Index()
  @Column({ type: 'varchar', length: 255 })
  hashed_token: string;

  @Column({ type: 'enum', enum: TokenType })
  type: TokenType;

  @Column({ type: 'timestamp with time zone' })
  expires_at: Date;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;
}
