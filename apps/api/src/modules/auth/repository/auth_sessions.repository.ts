import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';

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
      where: { user: { id: user_id } },
      order: { createdAt: 'DESC' },
    });
  }

  async findPaginatedByUser(
    user_id: string,
    filters: SessionFiltersDto,
    manager?: EntityManager,
  ) {
    const repo = this.getRepo(manager);

    // Setup query context
    const queryBuilder = repo
      .createQueryBuilder('session')
      .where('session.user.id = :user_id', { user_id })
      .orderBy('session.createdAt', filters.sortOrder);

    if (filters.createdAfter) {
      queryBuilder.andWhere('session.createdAt >= :createdAfter', {
        createdAfter: filters.createdAfter,
      });
    }

    return await this.paginate(queryBuilder, filters);
  }

  async createSession(
    refresh_token: string,
    user_id: string,
    manager?: EntityManager,
  ): Promise<AuthSessionsEntity> {
    const repo = this.getRepo(manager);

    const session = repo.create({
      refresh_token,
      user: { id: user_id },
    });

    return await repo.save(session);
  }

  async findSession(
    refresh_token: string,
    user_id: string,
    manager?: EntityManager,
  ): Promise<AuthSessionsEntity | null> {
    return await this.findByTokenAndUser(refresh_token, user_id, manager);
  }

  async updateSession(
    old_refresh_token: string,
    new_refresh_token: string,
    user_id: string,
    manager?: EntityManager,
  ): Promise<AuthSessionsEntity | null> {
    const repo = this.getRepo(manager);

    const session = await this.findByTokenAndUser(
      old_refresh_token,
      user_id,
      manager,
    );

    if (!session) {
      return null;
    }

    session.refresh_token = new_refresh_token;
    return await repo.save(session);
  }

  async deleteSession(
    id: string,
    user_id: string,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = this.getRepo(manager);

    await repo.delete({
      id,
      user: { id: user_id },
    });
  }

  async deleteAllSessions(
    user_id: string,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = this.getRepo(manager);

    await repo.delete({
      user: { id: user_id },
    });
  }

  // PRIVATE METHODS

  private async findByTokenAndUser(
    refresh_token: string,
    user_id: string,
    manager?: EntityManager,
  ): Promise<AuthSessionsEntity | null> {
    const repo = this.getRepo(manager);

    return await repo.findOne({
      where: { refresh_token, user: { id: user_id } },
    });
  }
}
