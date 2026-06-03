import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, QueryDeepPartialEntity } from 'typeorm';

import { DeviceMetadata } from '@app/types';

import { BaseRepository } from '../../../repository/base.repository';
import { SessionFiltersDto } from '../dtos/auth_sessions.dto';
import { AuthSessionsEntity } from '../entities/auth_sessions.entity';

@Injectable()
export class AuthSessionsRepository extends BaseRepository<AuthSessionsEntity> {
  constructor(datasource: DataSource) {
    super(AuthSessionsEntity, datasource);
  }

  async findAllByUser(user_id: string, manager?: EntityManager) {
    const repo = this.getRepo(manager);

    return await repo.find({
      where: { user_id },
      order: { createdAt: 'DESC' },
    });
  }

  async findPaginatedByUser(
    user_id: string,
    filters: SessionFiltersDto,
    manager?: EntityManager,
  ) {
    const repo = this.getRepo(manager);

    const queryBuilder = repo
      .createQueryBuilder('session')
      .where('session.user_id = :user_id', { user_id })
      .orderBy('session.createdAt', filters.sortOrder);

    if (filters.createdAfter) {
      queryBuilder.andWhere('session.createdAt >= :createdAfter', {
        createdAfter: filters.createdAfter,
      });
    }

    const { data: sessions, meta } = await this.paginate(queryBuilder, filters);
    return { sessions, meta };
  }

  async upsertSession(
    refresh_token: string,
    user_id: string,
    device_id: string,
    metadata?: DeviceMetadata,
    manager?: EntityManager,
  ): Promise<AuthSessionsEntity> {
    const repo = this.getRepo(manager);

    await repo.upsert(
      {
        refresh_token,
        user_id,
        device_id,
        metadata: metadata as
          | QueryDeepPartialEntity<DeviceMetadata>
          | undefined,
      },
      ['user_id', 'device_id'],
    );

    return await repo.findOneOrFail({
      where: { user_id, device_id },
    });
  }

  async findSession(
    refresh_token: string,
    user_id: string,
    device_id: string,
    manager?: EntityManager,
  ): Promise<AuthSessionsEntity | null> {
    const repo = this.getRepo(manager);

    return await repo.findOne({
      where: { refresh_token, user_id, device_id },
    });
  }

  async updateSession(
    old_refresh_token: string,
    new_refresh_token: string,
    user_id: string,
    device_id: string,
    manager?: EntityManager,
  ): Promise<AuthSessionsEntity | null> {
    const repo = this.getRepo(manager);

    const updateResult = await repo.update(
      { refresh_token: old_refresh_token, user_id, device_id },
      { refresh_token: new_refresh_token },
    );

    if (updateResult.affected === 0) {
      return null;
    }

    return await repo.findOne({
      where: { refresh_token: new_refresh_token },
    });
  }

  async deleteSession(
    id: string,
    user_id: string,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = this.getRepo(manager);

    await repo.delete({
      id,
      user_id,
    });
  }

  async deleteAllSessions(
    user_id: string,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = this.getRepo(manager);

    await repo.delete({
      user_id,
    });
  }
}
