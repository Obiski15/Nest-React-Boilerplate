import * as crypto from 'crypto';
import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { DataSource, EntityManager } from 'typeorm';

import { parseUserAgent } from '@app/helpers';
import type { AuthJwtPayload, DeviceMetadata } from '@app/types';
import { NotificationChannel } from '@app/types';

import { BlacklistService } from '../../../common/blacklist/services/blacklist.service';
import { EncryptionService } from '../../../common/encryption/services/encryption.service';
import { AppLogger } from '../../../common/logger/logger.service';
import { TEMPLATE_NAMES } from '../../../common/templates/enums/templates.enum';
import { TemplateService } from '../../../common/templates/services/template.service';
import { LOG_EVENTS } from '../../../constants/log_events';
import { LOG_MESSAGES } from '../../../constants/log_messages';
import * as SYS_MESSAGES from '../../../constants/system_messages';
import {
  NotificationEventType,
  NotificationTitle,
} from '../../notification/enums/notification.enum';
import { NotificationService } from '../../notification/services/notification.service';
import { UserEntity } from '../../user/entities/user.entity';
import { UserService } from '../../user/services/user.service';
import { LoginDto, RegisterDto, ResetPasswordDto } from '../dtos/auth.dto';
import { TokenType } from '../enums/auth_token.enum';
import { AuthTokenRepository } from '../repository/auth_token.repository';
import { AuthSessionsService } from './auth_sessions.service';
import { TwoFactorService } from './two_factor.service';

@Injectable()
export class AuthService {
  private readonly frontend_url: string;

  constructor(
    private readonly notificationService: NotificationService,
    private readonly authSessionsService: AuthSessionsService,
    private readonly authTokenRepository: AuthTokenRepository,
    private readonly encryptionService: EncryptionService,
    private readonly twoFactorService: TwoFactorService,
    private readonly blacklistService: BlacklistService,
    private readonly templateService: TemplateService,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly dataSource: DataSource,
    private readonly jwtService: JwtService,
    private readonly logger: AppLogger,
  ) {
    this.frontend_url =
      this.configService.getOrThrow<string>('APP.FRONTEND_URL');
    this.logger.setContext(AuthService.name);
  }

  async register(
    userData: RegisterDto,
    device_id: string,
    metadata?: DeviceMetadata,
  ) {
    const existingUser = await this.userService.getByEmail({
      validateStatus: false,
      email: userData.email,
    });

    if (existingUser) {
      throw new ConflictException(SYS_MESSAGES.EMAIL_ALREADY_EXISTS);
    }

    const salt_rounds = this.configService.getOrThrow<number>(
      'AUTH.BCRYPT_SALT_ROUNDS',
    );

    const hashedPassword = await bcrypt.hash(userData.password, salt_rounds);

    return await this.dataSource.transaction(async (manager) => {
      try {
        const newUser = await this.userService.create(
          {
            ...userData,
            password: hashedPassword,
          },
          manager,
        );

        const tokens = await this.generateTokens({
          sub: newUser.id,
          email: newUser.email,
          role: newUser.role,
        });

        await this.authSessionsService.upsertSession(
          this.encryptionService.hash(tokens.refresh_token),
          newUser.id,
          device_id,
          metadata,
          manager,
        );

        const message = this.templateService.render(TEMPLATE_NAMES.WELCOME, {
          user: { name: newUser.name, email: newUser.email },
          action_url: this.frontend_url,
        });

        await this.notificationService.dispatch({
          event_type: NotificationEventType.WELCOME_MESSAGE,
          override_channels: [NotificationChannel.EMAIL],
          title: NotificationTitle.WELCOME_MESSAGE,
          user_id: newUser.id,
          message,
        });

        await this.generateAndSendToken(
          newUser,
          TokenType.EMAIL_VERIFICATION,
          manager,
        );

        this.logger.audit(LOG_MESSAGES.USER.REGISTERED(newUser.email), {
          id: newUser.id,
          name: newUser.name,
          event: LOG_EVENTS.USER_REGISTERED,
        });

        return {
          tokens,
          user: newUser,
        };
      } catch (error) {
        this.logger.error(
          LOG_MESSAGES.USER.REGISTRATION_FAILED(userData.email),
          { event: LOG_EVENTS.USER_REGISTRATION_FAILED },
          (error as Error).stack,
        );

        if (error instanceof HttpException) throw error;

        throw new InternalServerErrorException(
          SYS_MESSAGES.USER_REGISTRATION_FAILED,
        );
      }
    });
  }

  async login(
    loginData: LoginDto,
    device_id: string,
    metadata?: DeviceMetadata,
  ) {
    try {
      const user = await this.userService.getByEmail({
        email: loginData.email,
        options: {
          select: [
            'password',
            'id',
            'is_email_verified',
            'is_two_factor_enabled',
            'email',
            'name',
            'is_active',
            'deletedAt',
          ],
        },
      });

      if (!user) {
        this.logger.security(LOG_MESSAGES.AUTH.LOGIN_FAILURE(loginData.email), {
          event: LOG_EVENTS.AUTH_LOGIN_FAILURE,
          reason: 'User not found',
        });
        throw new UnauthorizedException(SYS_MESSAGES.INVALID_CREDENTIALS);
      }

      const isPasswordValid = await this.verifyPassword(
        loginData.password,
        user.password,
      );

      if (!isPasswordValid) {
        this.logger.security(LOG_MESSAGES.AUTH.LOGIN_FAILURE(user.email), {
          event: LOG_EVENTS.AUTH_LOGIN_FAILURE,
          reason: 'Password mismatch',
        });
        throw new UnauthorizedException(SYS_MESSAGES.INVALID_CREDENTIALS);
      }

      if (user.is_two_factor_enabled) {
        const { v7 } = (await import('uuid')) as { v7: () => string };

        const temp_token = await this.jwtService.signAsync(
          {
            sub: user.id,
            email: user.email,
            role: user.role,
            is_temp_2fa: true,
            jti: v7(),
          },
          {
            secret: this.configService.getOrThrow<string>(
              'JWT.TEMP_2FA_SECRET',
            ),
            expiresIn: this.configService.getOrThrow<
              JwtSignOptions['expiresIn']
            >('JWT.TEMP_2FA_TOKEN_EXPIRES_IN'),
          },
        );

        this.logger.log(LOG_MESSAGES.AUTH.TWO_FACTOR_CHALLENGE(user.id), {
          event: LOG_EVENTS.AUTH_2FA_CHALLENGE,
        });

        return {
          requires_2fa: true,
          temp_token,
          message: SYS_MESSAGES.REQUIRE_2FA,
        };
      }

      return await this.sessionManagementWithTokenGeneration(
        user,
        device_id,
        metadata,
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;

      this.logger.error(
        LOG_MESSAGES.AUTH.LOGIN_FAILURE(loginData.email),
        {
          event: LOG_EVENTS.AUTH_LOGIN_FAILURE,
          error: (error as Error).message,
        },
        (error as Error).stack,
      );

      throw new InternalServerErrorException(
        SYS_MESSAGES.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async verify2faLogin(
    temp_token: string,
    code: string,
    device_id: string,
    metadata?: DeviceMetadata,
  ) {
    let payload: AuthJwtPayload;

    try {
      payload = await this.jwtService.verifyAsync(temp_token, {
        secret: this.configService.get<string>('JWT.TEMP_2FA_SECRET'),
      });
    } catch {
      throw new UnauthorizedException(SYS_MESSAGES.LOGIN_SESSION_EXPIRED);
    }

    await this.blacklistService.revokeAccess(temp_token, payload);

    if (!payload.is_temp_2fa) {
      throw new UnauthorizedException(SYS_MESSAGES.UNAUTHORIZED);
    }

    const userId = payload.sub;

    const isValid = await this.twoFactorService.verifyTwoFactorCode(
      userId,
      code,
    );

    if (!isValid) {
      this.logger.security(LOG_MESSAGES.AUTH.TWO_FACTOR_FAILED(userId), {
        event: LOG_EVENTS.AUTH_2FA_FAILED,
      });
      throw new UnauthorizedException(SYS_MESSAGES.INVALID_2FA_CODE);
    }

    const user = await this.userService.getById({ id: userId });

    if (!user) {
      this.logger.security(LOG_MESSAGES.USER.NOT_FOUND(), {
        event: LOG_EVENTS.AUTH_USER_NOT_FOUND,
        user_id: userId,
      });
      throw new NotFoundException(SYS_MESSAGES.USER_NOT_FOUND);
    }

    const data = await this.sessionManagementWithTokenGeneration(
      user,
      device_id,
      metadata,
    );
    await this.blacklistService.blacklistToken(temp_token, payload);

    return data;
  }

  async verify2faRecovery(
    temp_token: string,
    recoveryCode: string,
    device_id: string,
    metadata?: DeviceMetadata,
  ) {
    let payload: AuthJwtPayload;
    try {
      payload = await this.jwtService.verifyAsync(temp_token, {
        secret: this.configService.get<string>('JWT.TEMP_2FA_SECRET'),
      });
    } catch {
      throw new UnauthorizedException(SYS_MESSAGES.LOGIN_SESSION_EXPIRED);
    }

    await this.blacklistService.revokeAccess(temp_token, payload);

    if (!payload.is_temp_2fa) {
      throw new UnauthorizedException(SYS_MESSAGES.UNAUTHORIZED);
    }

    const userId = payload.sub;

    const user = await this.userService.getById({
      id: userId,
      options: { select: ['id', 'email', 'two_factor_recovery_codes'] },
    });

    if (
      !user.two_factor_recovery_codes ||
      user.two_factor_recovery_codes.length === 0
    ) {
      throw new BadRequestException(SYS_MESSAGES.NO_RECOVERY_CODES_LEFT);
    }

    const hashedIncomingCode = this.encryptionService.hash(recoveryCode);
    const codeMatchIndex =
      user.two_factor_recovery_codes.indexOf(hashedIncomingCode);

    if (codeMatchIndex === -1) {
      this.logger.security(
        LOG_MESSAGES.AUTH.TWO_FACTOR_RECOVERY_FAILED(userId),
        { event: LOG_EVENTS.AUTH_2FA_RECOVERY_FAILED },
      );
      throw new UnauthorizedException(SYS_MESSAGES.INVALID_RECOVERY_CODE);
    }

    const updatedCodes = user.two_factor_recovery_codes.filter(
      (_, index) => index !== codeMatchIndex,
    );

    await this.userService.update(user.id, {
      two_factor_recovery_codes: updatedCodes,
    });

    this.logger.audit(LOG_MESSAGES.AUTH.TWO_FACTOR_RECOVERY_USED(userId), {
      event: LOG_EVENTS.AUTH_2FA_RECOVERY_USED,
    });

    const fullUser = await this.userService.getById({ id: userId });

    const data = await this.sessionManagementWithTokenGeneration(
      fullUser,
      device_id,
      metadata,
    );
    await this.blacklistService.blacklistToken(temp_token, payload);

    return data;
  }

  async logout(
    user_id: string,
    access_token: string,
    refresh_token: string,
    device_id: string,
  ) {
    await this.validateRefreshToken(refresh_token);

    const activeSession = await this.authSessionsService.find(
      this.encryptionService.hash(refresh_token),
      user_id,
      device_id,
    );

    if (!activeSession) {
      this.logger.security(LOG_MESSAGES.AUTH.UNAUTHORIZED_ACCESS('logout'), {
        event: LOG_EVENTS.AUTH_LOGOUT,
        user_id,
        device_id,
      });
      throw new UnauthorizedException(SYS_MESSAGES.INVALID_REFRESH_TOKEN);
    }

    await this.authSessionsService.delete(activeSession.id, user_id);
    this.logger.log(LOG_MESSAGES.AUTH.LOGOUT(user_id), {
      event: LOG_EVENTS.AUTH_LOGOUT,
      device_id,
    });

    let decoded: AuthJwtPayload;

    try {
      decoded = this.jwtService.decode(access_token);
    } catch (error) {
      this.logger.error(
        LOG_MESSAGES.AUTH.TOKEN_DECODE_FAILED(access_token),
        { event: LOG_EVENTS.AUTH_LOGOUT, user_id },
        (error as Error).stack,
      );
      throw new UnauthorizedException(SYS_MESSAGES.INVALID_ACCESS_TOKEN);
    }

    await this.blacklistService.blacklistToken(access_token, decoded);
  }

  // TOKEN ROTATION
  async refreshToken(refresh_token: string, device_id: string) {
    const { sub: user_id } = await this.validateRefreshToken(refresh_token);

    const user = await this.userService.getById({ id: user_id });
    this.userService.validateUserStatus(user);

    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    try {
      await this.authSessionsService.update(
        this.encryptionService.hash(refresh_token),
        this.encryptionService.hash(tokens.refresh_token),
        user_id,
        device_id,
      );

      this.logger.audit(LOG_MESSAGES.AUTH.REFRESH_TOKEN_ROTATED(user_id), {
        event: LOG_EVENTS.AUTH_REFRESH_TOKEN_ROTATED,
        device_id,
      });
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        await this.authSessionsService.deleteAll(user_id);
        this.logger.security(LOG_MESSAGES.AUTH.REFRESH_TOKEN_REUSE(user_id), {
          event: LOG_EVENTS.AUTH_REFRESH_TOKEN_REUSE,
          device_id,
          error: (error as Error).message,
        });
        throw new UnauthorizedException(SYS_MESSAGES.INVALID_REFRESH_TOKEN);
      }

      this.logger.error(
        LOG_MESSAGES.AUTH.REFRESH_TOKEN_REUSE(user_id),
        {
          event: LOG_EVENTS.AUTH_REFRESH_TOKEN_REUSE,
          error: (error as Error).message,
        },
        (error as Error).stack,
      );

      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        SYS_MESSAGES.INTERNAL_SERVER_ERROR,
      );
    }

    return { tokens };
  }

  async resendVerificationEmail(email: string) {
    const user = await this.userService.getByEmail({
      email,
      validateStatus: false,
    });

    if (!user || user.is_email_verified) return;

    await this.generateAndSendToken(user, TokenType.EMAIL_VERIFICATION);
  }

  async verifyEmail(rawToken: string) {
    const user = await this.validateAndDeleteToken(
      rawToken,
      TokenType.EMAIL_VERIFICATION,
    );

    await this.userService.update(user.id, { is_email_verified: true });

    this.logger.audit(LOG_MESSAGES.AUTH.EMAIL_VERIFIED(user.id), {
      event: LOG_EVENTS.AUTH_EMAIL_VERIFIED,
    });
  }

  async forgotPassword(email: string) {
    const user = await this.userService.getByEmail({
      email,
      validateStatus: false,
    });

    if (!user || !user.is_active) return;

    await this.generateAndSendToken(user, TokenType.PASSWORD_RESET);
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.validateAndDeleteToken(
      dto.token,
      TokenType.PASSWORD_RESET,
    );

    const salt_rounds = this.configService.getOrThrow<number>(
      'AUTH.BCRYPT_SALT_ROUNDS',
    );
    const hashedPassword = await bcrypt.hash(dto.new_password, salt_rounds);

    await this.dataSource.transaction(async (manager) => {
      await this.userService.update(
        user.id,
        { password: hashedPassword },
        manager,
      );
      await this.authSessionsService.deleteAll(user.id, manager);
    });

    const template = this.templateService.render(
      TEMPLATE_NAMES.PASSWORD_CHANGE,
      {
        user: { name: user.name, email: user.email },
        action_url: this.frontend_url,
      },
    );

    await this.notificationService.dispatch({
      event_type: NotificationEventType.PASSWORD_CHANGE,
      override_channels: [NotificationChannel.EMAIL],
      title: NotificationTitle.PASSWORD_CHANGE,
      user_id: user.id,
      message: template,
    });

    this.logger.audit(LOG_MESSAGES.AUTH.PASSWORD_RESET(user.id), {
      event: LOG_EVENTS.AUTH_PASSWORD_RESET,
    });
  }

  // PRIVATE METHODS
  private async sessionManagementWithTokenGeneration(
    user: UserEntity,
    device_id: string,
    metadata?: DeviceMetadata,
  ) {
    const sessions = await this.authSessionsService.findAll(user.id);
    const sessionLimit =
      this.configService.getOrThrow<number>('AUTH.SESSION_LIMIT');

    const isKnownDevice = sessions.some((s) => s.device_id === device_id);

    if (!isKnownDevice && sessions.length >= sessionLimit) {
      const sortedSessions = [...sessions].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
      const oldestSession = sortedSessions[0];

      this.logger.log(LOG_MESSAGES.AUTH.SESSION_EVICTED(user.id), {
        event: LOG_EVENTS.AUTH_SESSION_EVICTED,
      });
      await this.authSessionsService.delete(oldestSession.id, user.id);
    }

    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    await this.authSessionsService.upsertSession(
      this.encryptionService.hash(tokens.refresh_token),
      user.id,
      device_id,
      metadata,
    );

    if (!isKnownDevice) {
      const message = this.templateService.render(
        TEMPLATE_NAMES.NEW_DEVICE_LOGIN,
        {
          user: { name: user.name, email: user.email },
          action_url: `${this.frontend_url}/settings`,
          context: {
            device: parseUserAgent(metadata?.userAgent),
            location: metadata?.timeZone,
            time: new Date().toLocaleString('en-US', {
              timeZone: metadata?.timeZone || 'UTC',
            }),
          },
        },
      );

      await this.notificationService.dispatch({
        event_type: NotificationEventType.LOGIN_ALERT,
        override_channels: [NotificationChannel.EMAIL],
        title: NotificationTitle.LOGIN_ALERT,
        user_id: user.id,
        message,
      });
    }

    this.logger.audit(LOG_MESSAGES.AUTH.LOGIN_SUCCESS(user.id), {
      email: user.email,
      event: LOG_EVENTS.AUTH_LOGIN_SUCCESS,
      device_id,
    });

    return { tokens, user };
  }

  private async generateTokens(data: AuthJwtPayload) {
    return {
      access_token: await this.generateAccessToken(data),
      refresh_token: await this.generateRefreshToken(data),
    };
  }

  private async generateAccessToken(data: AuthJwtPayload) {
    const { v7 } = (await import('uuid')) as { v7: () => string };
    return await this.jwtService.signAsync({ ...data, jti: v7() });
  }

  private async generateRefreshToken(data: AuthJwtPayload) {
    return await this.jwtService.signAsync(data, {
      secret: this.configService.get<string>('JWT.REFRESH_SECRET'),
      expiresIn: this.configService.get<JwtSignOptions['expiresIn']>(
        'JWT.REFRESH_EXPIRES_IN',
      ),
    });
  }

  private async validateRefreshToken(token?: string) {
    if (!token) {
      throw new UnauthorizedException(SYS_MESSAGES.INVALID_REFRESH_TOKEN);
    }
    let payload: AuthJwtPayload;

    try {
      payload = await this.jwtService.verifyAsync<AuthJwtPayload>(token, {
        secret: this.configService.getOrThrow<string>('JWT.REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException(SYS_MESSAGES.INVALID_REFRESH_TOKEN);
    }
    return payload;
  }

  private async verifyPassword(plainPassword: string, hashedPassword: string) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  private async generateAndSendToken(
    user: UserEntity,
    type: TokenType,
    manager?: EntityManager,
  ) {
    await this.authTokenRepository.deleteByType(user.id, type, manager);

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = this.encryptionService.hash(rawToken);

    const expirationHours =
      type === TokenType.EMAIL_VERIFICATION
        ? this.configService.getOrThrow<number>(
            'AUTH.EMAIL_VERIFICATION_TOKEN_EXPIRES_IN',
          )
        : this.configService.getOrThrow<number>(
            'AUTH.PASSWORD_RESET_TOKEN_EXPIRES_IN',
          );

    const expiresAt = new Date(Date.now() + expirationHours * 60 * 60 * 1000);

    await this.authTokenRepository.createToken(
      {
        user_id: user.id,
        hashed_token: hashedToken,
        type,
        expires_at: expiresAt,
      },
      manager,
    );

    let template: string;
    let title: NotificationTitle;

    if (type === TokenType.EMAIL_VERIFICATION) {
      template = this.templateService.render(
        TEMPLATE_NAMES.ACCOUNT_VERIFICATION,
        {
          user: { name: user.name, email: user.email },
          action_url: `${this.frontend_url}/verify-email?token=${rawToken}&email=${user.email}`,
        },
      );
      title = NotificationTitle.EMAIL_VERIFICATION;

      await this.notificationService.dispatch({
        event_type: NotificationEventType.EMAIL_VERIFICATION,
        override_channels: [NotificationChannel.EMAIL],
        user_id: user.id,
        message: template,
        title,
      });
    } else {
      template = this.templateService.render(TEMPLATE_NAMES.PASSWORD_RESET, {
        user: { name: user.name, email: user.email },
        action_url: `${this.frontend_url}/reset-password?token=${rawToken}&email=${user.email}`,
      });
      title = NotificationTitle.PASSWORD_RESET;

      await this.notificationService.dispatch({
        event_type: NotificationEventType.PASSWORD_RESET,
        override_channels: [NotificationChannel.EMAIL],
        user_id: user.id,
        message: template,
        title,
      });
    }
  }

  private async validateAndDeleteToken(rawToken: string, type: TokenType) {
    const hashedToken = this.encryptionService.hash(rawToken);
    const tokenRecord = await this.authTokenRepository.findToken(
      hashedToken,
      type,
    );

    if (!tokenRecord) {
      throw new BadRequestException(SYS_MESSAGES.INVALID_TOKEN);
    }

    if (new Date() > tokenRecord.expires_at) {
      await this.authTokenRepository.delete(tokenRecord.id);
      throw new BadRequestException(SYS_MESSAGES.INVALID_TOKEN);
    }

    await this.authTokenRepository.delete(tokenRecord.id);
    return tokenRecord.user;
  }
}
