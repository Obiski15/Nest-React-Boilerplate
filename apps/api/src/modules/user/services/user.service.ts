import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager, FindOneOptions } from 'typeorm';

import { AppLogger } from '../../../common/logger/logger.service';
import { LOG_EVENTS } from '../../../constants/log_events';
import { LOG_MESSAGES } from '../../../constants/log_messages';
import * as SYS_MESSAGES from '../../../constants/system_messages';
import { UserFiltersDto } from '../dtos/user.dto';
import { UserEntity } from '../entities/user.entity';
import { UserRepository } from '../repository/user.repository';

@Injectable()
export class UserService {
  private readonly CACHE_KEY_PREFIX = 'user_profile:';
  private readonly CACHE_TTL = 900000;

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly userRepository: UserRepository,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(UserService.name);
  }

  async getPaginatedUsers(filters: UserFiltersDto, manager?: EntityManager) {
    return this.userRepository.findAll({ filters, manager });
  }

  async getById(data: {
    id: string;
    manager?: EntityManager;
    options?: FindOneOptions<UserEntity>;
  }) {
    const isStandardQuery = !data.manager && !data.options;
    const cacheKey = `${this.CACHE_KEY_PREFIX}${data.id}`;

    // Try fetching from Redis first
    if (isStandardQuery) {
      const cachedUser = await this.cacheManager.get<UserEntity>(cacheKey);
      if (cachedUser) {
        return cachedUser;
      }
    }

    const user = await this.userRepository.findById(data);

    if (!user) {
      throw new NotFoundException(SYS_MESSAGES.USER_NOT_FOUND);
    }

    if (isStandardQuery) {
      await this.cacheManager.set(cacheKey, user, this.CACHE_TTL);
    }

    return user;
  }

  async getByEmail(data: {
    email: string;
    manager?: EntityManager;
    options?: FindOneOptions<UserEntity>;
    validateStatus?: boolean;
  }) {
    const user = await this.userRepository.findByEmail(data);

    const shouldValidate = data.validateStatus ?? true;

    if (shouldValidate) {
      this.validateUserStatus(user);
      return user!;
    }

    return user;
  }

  async create(userDto: Partial<UserEntity>, manager?: EntityManager) {
    const user = await this.userRepository.createUser(userDto, manager);

    this.logger.audit(LOG_MESSAGES.USER.CREATED(user.id), {
      event: LOG_EVENTS.USER_CREATED,
      email: user.email,
    });

    return user;
  }

  async update(id: string, data: Partial<UserEntity>, manager?: EntityManager) {
    if (data.email) {
      const existingUser = await this.userRepository.findByEmail({
        email: data.email,
        manager,
      });

      if (existingUser && existingUser.id !== id) {
        this.logger.security(
          LOG_MESSAGES.USER.UPDATE_FAILED(id, 'Email collision'),
          {
            event: LOG_EVENTS.USER_UPDATE_FAILED,
            target_email: data.email,
          },
        );
        throw new ConflictException(SYS_MESSAGES.EMAIL_ALREADY_EXISTS);
      }
    }

    const updatedUser = await this.userRepository.updateUser(id, data, manager);

    if (!updatedUser) {
      throw new NotFoundException(SYS_MESSAGES.USER_NOT_FOUND);
    }

    await this.invalidateUserCache(id);

    this.logger.log(LOG_MESSAGES.USER.UPDATED(id), {
      event: LOG_EVENTS.USER_UPDATED,
    });

    return updatedUser;
  }

  async softDelete(id: string, manager?: EntityManager) {
    await this.userRepository.softDeleteUser(id, manager);

    await this.invalidateUserCache(id);

    this.logger.audit(LOG_MESSAGES.USER.DELETED(id), {
      event: LOG_EVENTS.USER_DELETED,
    });
  }

  validateUserStatus(user: UserEntity | null) {
    if (!user) {
      this.logger.security(
        LOG_MESSAGES.USER.ACCESS_DENIED('Unknown user', 'User not found'),
        {
          event: LOG_EVENTS.USER_ACCESS_DENIED,
        },
      );
      throw new NotFoundException(SYS_MESSAGES.USER_NOT_FOUND);
    }

    if (user.deletedAt !== null) {
      this.logger.security(
        LOG_MESSAGES.USER.ACCESS_DENIED(user.id, 'Account deleted'),
        {
          event: LOG_EVENTS.USER_ACCESS_DENIED,
        },
      );
      throw new ForbiddenException(SYS_MESSAGES.ACCOUNT_DELETED);
    }

    if (!user.is_active) {
      this.logger.security(
        LOG_MESSAGES.USER.ACCESS_DENIED(user.id, 'Account inactive'),
        {
          event: LOG_EVENTS.USER_ACCESS_DENIED,
        },
      );
      throw new ForbiddenException(SYS_MESSAGES.ACCOUNT_INACTIVE);
    }

    if (!user.is_email_verified) {
      this.logger.security(
        LOG_MESSAGES.USER.ACCESS_DENIED(user.id, 'Unverified email'),
        {
          event: LOG_EVENTS.USER_ACCESS_DENIED,
        },
      );
      throw new ForbiddenException(SYS_MESSAGES.EMAIL_NOT_VERIFIED);
    }
  }

  // PRIVATE METHODS
  private async invalidateUserCache(userId: string) {
    await this.cacheManager.del(`${this.CACHE_KEY_PREFIX}${userId}`);
  }
}
