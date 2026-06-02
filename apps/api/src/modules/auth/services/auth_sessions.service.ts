import { Injectable, UnauthorizedException } from '@nestjs/common';
import { EntityManager } from 'typeorm';

import { AppLogger } from '../../../common/logger/logger.service';
import { LOG_EVENTS } from '../../../constants/log_events';
import { LOG_MESSAGES } from '../../../constants/log_messages';
import * as SYS_MESSAGES from '../../../constants/system_messages';
import { SessionFiltersDto } from '../dtos/auth_sessions.dto';
import { AuthSessionsRepository } from '../repository/auth_sessions.repository';

@Injectable()
export class AuthSessionsService {
  constructor(
    private readonly sessionsRepo: AuthSessionsRepository,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(AuthSessionsService.name);
  }

  async findAllPaginated(
    user_id: string,
    filters: SessionFiltersDto = {},
    manager?: EntityManager,
  ) {
    return await this.sessionsRepo.findPaginatedByUser(
      user_id,
      filters,
      manager,
    );
  }

  async findAll(user_id: string, manager?: EntityManager) {
    return await this.sessionsRepo.findAllByUser(user_id, manager);
  }

  async find(
    refresh_token: string,
    user_id: string,
    device_id: string,
    manager?: EntityManager,
  ) {
    return await this.sessionsRepo.findSession(
      refresh_token,
      user_id,
      device_id,
      manager,
    );
  }

  async upsertSession(
    refresh_token: string,
    user_id: string,
    device_id: string,
    metadata?: Record<string, unknown>,
    manager?: EntityManager,
  ) {
    const session = await this.sessionsRepo.upsertSession(
      refresh_token,
      user_id,
      device_id,
      metadata,
      manager,
    );

    this.logger.log(LOG_MESSAGES.SESSION.CREATED(user_id), {
      event: LOG_EVENTS.SESSION_CREATED,
      device_id,
    });

    return session;
  }

  async update(
    old_refresh_token: string,
    new_refresh_token: string,
    user_id: string,
    device_id: string,
    manager?: EntityManager,
  ) {
    const session = await this.sessionsRepo.updateSession(
      old_refresh_token,
      new_refresh_token,
      user_id,
      device_id,
      manager,
    );

    if (!session) {
      this.logger.security(LOG_MESSAGES.SESSION.UPDATE_FAILED(user_id), {
        event: LOG_EVENTS.SESSION_UPDATE_FAILED,
        device_id,
      });
      throw new UnauthorizedException(SYS_MESSAGES.INVALID_REFRESH_TOKEN);
    }

    return session;
  }

  async delete(session_id: string, user_id: string, manager?: EntityManager) {
    await this.sessionsRepo.deleteSession(session_id, user_id, manager);

    this.logger.log(LOG_MESSAGES.SESSION.DELETED(user_id), {
      event: LOG_EVENTS.SESSION_DELETED,
      session_id,
    });
  }

  async deleteAll(user_id: string, manager?: EntityManager): Promise<void> {
    await this.sessionsRepo.deleteAllSessions(user_id, manager);

    this.logger.audit(LOG_MESSAGES.SESSION.REVOKED_ALL(user_id), {
      event: LOG_EVENTS.SESSION_REVOKED_ALL,
    });
  }
}
