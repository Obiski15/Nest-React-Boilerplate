import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';

import { BaseRepository } from '../../../repository/base.repository';
import { AuthTokenEntity } from '../entities/auth_token.entity';
import { TokenType } from '../enums/auth_token.enum';

@Injectable()
export class AuthTokenRepository extends BaseRepository<AuthTokenEntity> {
  constructor(datasource: DataSource) {
    super(AuthTokenEntity, datasource);
  }

  async createToken(
    data: {
      user_id: string;
      hashed_token: string;
      type: TokenType;
      expires_at: Date;
    },
    manager?: EntityManager,
  ): Promise<AuthTokenEntity> {
    const repo = this.getRepo(manager);

    const token = repo.create({
      hashed_token: data.hashed_token,
      type: data.type,
      expires_at: data.expires_at,
      user: { id: data.user_id },
    });

    return await repo.save(token);
  }

  async findToken(
    hashedToken: string,
    type: TokenType,
    manager?: EntityManager,
  ): Promise<AuthTokenEntity | null> {
    const repo = this.getRepo(manager);

    return await repo.findOne({
      where: {
        hashed_token: hashedToken,
        type: type,
      },
      relations: ['user'],
    });
  }

  //  Deletes all tokens of a specific type for a user.
  async deleteByType(
    userId: string,
    type: TokenType,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = this.getRepo(manager);

    await repo.delete({
      user: { id: userId },
      type: type,
    });
  }

  async deleteToken(tokenId: string, manager?: EntityManager): Promise<void> {
    const repo = this.getRepo(manager);

    await repo.delete({ id: tokenId });
  }

  // Useful for a nightly Cron Job to keep the table clean.
  async deleteExpiredTokens(manager?: EntityManager): Promise<void> {
    const repo = this.getRepo(manager);

    await repo
      .createQueryBuilder()
      .delete()
      .from(AuthTokenEntity)
      .where('expires_at < :now', { now: new Date() })
      .execute();
  }
}
