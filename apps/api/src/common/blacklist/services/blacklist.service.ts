import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';

import type { AuthJwtPayload } from '@app/types';

import { LOG_EVENTS } from '../../../constants/log_events';
import { LOG_MESSAGES } from '../../../constants/log_messages';
import * as SYS_MESSAGES from '../../../constants/system_messages';
import { AppLogger } from '../../logger/logger.service';

@Injectable()
export class BlacklistService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(BlacklistService.name);
  }

  async blacklistToken(token: string, payload: AuthJwtPayload) {
    try {
      if (payload && payload.jti && payload.exp) {
        const currentTimeInSeconds = Math.floor(Date.now() / 1000);
        const ttlInSeconds = payload.exp - currentTimeInSeconds;

        if (ttlInSeconds > 0) {
          await this.cacheManager.set(
            `bl_token:${payload.jti}`,
            'revoked',
            ttlInSeconds * 1000,
          );
          this.logger.log(LOG_MESSAGES.AUTH.TOKEN_BLACKLISTED(payload.sub), {
            event: LOG_EVENTS.AUTH_TOKEN_BLACKLISTED,
            jti: payload.jti,
            ttl: ttlInSeconds,
          });
        }

        return;
      }

      this.logger.error(
        LOG_MESSAGES.AUTH.TOKEN_BLACKLIST_FAILED(token),
        {
          event: LOG_EVENTS.AUTH_LOGOUT,
          user_id: payload.sub,
        },
        `Missing jti or exp in token payload`,
      );
    } catch (error) {
      this.logger.error(
        LOG_MESSAGES.AUTH.TOKEN_BLACKLIST_FAILED(token),
        {
          event: LOG_EVENTS.AUTH_LOGOUT,
          user_id: payload.sub,
        },
        (error as Error).stack,
      );
    }
  }

  async revokeAccess(token: string, payload: AuthJwtPayload) {
    try {
      if (payload && payload.jti) {
        const isBlacklisted = await this.cacheManager.get(
          `bl_token:${payload.jti}`,
        );

        if (isBlacklisted) {
          this.logger.security(
            LOG_MESSAGES.AUTH.BLACKLISTED_TOKEN_REUSE(payload.sub),
            {
              event: LOG_EVENTS.AUTH_BLACKLISTED_TOKEN_REUSE,
              token,
            },
          );
          throw new UnauthorizedException(SYS_MESSAGES.UNAUTHORIZED);
        }

        return;
      }

      this.logger.error(
        LOG_MESSAGES.AUTH.TOKEN_REUSE_CHECK_FAILED(token),
        {
          event: LOG_EVENTS.AUTH_BLACKLISTED_TOKEN_REUSE,
          user_id: payload.sub,
        },
        `Missing jti in token payload`,
      );

      throw new UnauthorizedException(SYS_MESSAGES.UNAUTHORIZED);
    } catch (error) {
      this.logger.error(
        LOG_MESSAGES.AUTH.TOKEN_REUSE_CHECK_FAILED(token),
        {
          event: LOG_EVENTS.AUTH_BLACKLISTED_TOKEN_REUSE,
          user_id: payload.sub,
        },
        (error as Error).stack,
      );
      throw new UnauthorizedException(SYS_MESSAGES.UNAUTHORIZED);
    }
  }
}
