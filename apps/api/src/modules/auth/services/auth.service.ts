import * as crypto from 'crypto';
import { InjectQueue } from '@nestjs/bullmq';
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
import { Queue } from 'bullmq';
import { DataSource, EntityManager } from 'typeorm';

import type { AuthJwtPayload } from '@app/types';

import { BlacklistService } from '../../../common/blacklist/services/blacklist.service';
import { EncryptionService } from '../../../common/encryption/services/encryption.service';
import { AppLogger } from '../../../common/logger/logger.service';
import {
  MAIL_QUEUE_NAME,
  MailJobName,
} from '../../../common/mail/enums/mail-job.enum';
import {
  IAuthTokenContext,
  IMailJob,
} from '../../../common/mail/interfaces/mail-job.interface';
import { LOG_EVENTS } from '../../../constants/log_events';
import { LOG_MESSAGES } from '../../../constants/log_messages';
import * as SYS_MESSAGES from '../../../constants/system_messages';
import { UserEntity } from '../../user/entities/user.entity';
import { UserService } from '../../user/services/user.service';
import { LoginDto, RegisterDto, ResetPasswordDto } from '../dtos/auth.dto';
import { TokenType } from '../enums/auth_token.enum';
import { AuthTokenRepository } from '../repository/auth_token.repository';
import { AuthSessionsService } from './auth_sessions.service';
import { TwoFactorService } from './two_factor.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectQueue(MAIL_QUEUE_NAME) private readonly mailQueue: Queue,
    private readonly authSessionsService: AuthSessionsService,
    private readonly authTokenRepository: AuthTokenRepository,
    private readonly encryptionService: EncryptionService,
    private readonly twoFactorService: TwoFactorService,
    private readonly blacklistService: BlacklistService,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly dataSource: DataSource,
    private readonly jwtService: JwtService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(AuthService.name);
  }

  async register(userData: RegisterDto) {
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

    // Atomic Transaction for Account Creation
    return await this.dataSource.transaction(async (manager) => {
      try {
        // Save the new User
        const newUser = await this.userService.create(
          {
            ...userData,
            password: hashedPassword,
          },
          manager,
        );

        // Generate the token pair
        const tokens = await this.generateTokens({
          sub: newUser.id,
          email: newUser.email,
          role: newUser.role,
        });

        // Store the session
        await this.authSessionsService.create(
          this.encryptionService.hash(tokens.refresh_token),
          newUser.id,
          manager,
        );

        const WelcomeEmailJobPayload: IMailJob = {
          user: {
            name: newUser.name,
            email: newUser.email,
          },
          context: {},
        };

        // Send Welcome and Verification Email
        await this.mailQueue.add(
          MailJobName.SEND_WELCOME,
          WelcomeEmailJobPayload,
          {
            jobId: `welcome-${newUser.id}-${Date.now()}`,
          },
        );
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
          {
            event: LOG_EVENTS.USER_REGISTRATION_FAILED,
          },
          (error as Error).stack,
        );

        if (error instanceof HttpException) throw error;

        throw new InternalServerErrorException(
          SYS_MESSAGES.USER_REGISTRATION_FAILED,
        );
      }
    });
  }

  async login(loginData: LoginDto) {
    try {
      // Fetch User
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

      // Verify Password
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
        // Issue a short-lived temporary token
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

      return await this.sessionManagementWithTokenGeneration(user);
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

  async verify2faLogin(temp_token: string, code: string) {
    let payload: AuthJwtPayload;

    try {
      // verify using the specific 2FA secret
      payload = await this.jwtService.verifyAsync(temp_token, {
        secret: this.configService.get<string>('JWT.TEMP_2FA_SECRET'),
      });
    } catch {
      throw new UnauthorizedException(SYS_MESSAGES.LOGIN_SESSION_EXPIRED);
    }

    // Check Redis Denylist before proceeding
    await this.blacklistService.revokeAccess(temp_token, payload);

    // Double check it's actually a 2FA token
    if (!payload.is_temp_2fa) {
      throw new UnauthorizedException(SYS_MESSAGES.UNAUTHORIZED);
    }

    const userId = payload.sub;

    // Verify the code
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

    // Fetch user to complete login
    const user = await this.userService.getById({ id: userId });

    if (!user) {
      this.logger.security(LOG_MESSAGES.USER.NOT_FOUND(), {
        event: LOG_EVENTS.AUTH_USER_NOT_FOUND,
        user_id: userId,
      });
      throw new NotFoundException(SYS_MESSAGES.USER_NOT_FOUND);
    }

    const data = await this.sessionManagementWithTokenGeneration(user);

    // Blacklist temp token so it can never be used again
    await this.blacklistService.blacklistToken(temp_token, payload);

    return data;
  }

  async verify2faRecovery(temp_token: string, recoveryCode: string) {
    let payload: AuthJwtPayload;
    try {
      payload = await this.jwtService.verifyAsync(temp_token, {
        secret: this.configService.get<string>('JWT.TEMP_2FA_SECRET'),
      });
    } catch {
      throw new UnauthorizedException(SYS_MESSAGES.LOGIN_SESSION_EXPIRED);
    }

    // Check Redis Denylist before proceeding
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

    // Hash the incoming code to see if it matches any in the database
    const hashedIncomingCode = this.encryptionService.hash(recoveryCode);
    const codeMatchIndex =
      user.two_factor_recovery_codes.indexOf(hashedIncomingCode);

    if (codeMatchIndex === -1) {
      this.logger.security(
        LOG_MESSAGES.AUTH.TWO_FACTOR_RECOVERY_FAILED(userId),
        {
          event: LOG_EVENTS.AUTH_2FA_RECOVERY_FAILED,
        },
      );
      throw new UnauthorizedException(SYS_MESSAGES.INVALID_RECOVERY_CODE);
    }

    // BURN THE CODE
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

    const data = await this.sessionManagementWithTokenGeneration(fullUser);

    // Blacklist temp token so it can never be used again
    await this.blacklistService.blacklistToken(temp_token, payload);

    return data;
  }

  // Clears the active session for the user.
  async logout(user_id: string, access_token: string, refresh_token?: string) {
    await this.validateRefreshToken(refresh_token);

    //  Delete the session from DB
    const activeSession = await this.authSessionsService.find(
      this.encryptionService.hash(refresh_token!),
      user_id,
    );

    if (!activeSession) {
      this.logger.security(LOG_MESSAGES.AUTH.UNAUTHORIZED_ACCESS('logout'), {
        event: LOG_EVENTS.AUTH_LOGOUT,
        user_id,
      });
      throw new UnauthorizedException(SYS_MESSAGES.INVALID_REFRESH_TOKEN);
    }

    if (activeSession) {
      await this.authSessionsService.delete(activeSession.id, user_id);
      this.logger.log(LOG_MESSAGES.AUTH.LOGOUT(user_id), {
        event: LOG_EVENTS.AUTH_LOGOUT,
      });
    } else {
      this.logger.security(LOG_MESSAGES.AUTH.UNAUTHORIZED_ACCESS('logout'), {
        event: LOG_EVENTS.AUTH_LOGOUT,
        user_id,
      });
    }
    let decoded: AuthJwtPayload;

    try {
      decoded = this.jwtService.decode(access_token);
    } catch (error) {
      this.logger.error(
        LOG_MESSAGES.AUTH.TOKEN_DECODE_FAILED(access_token),
        {
          event: LOG_EVENTS.AUTH_LOGOUT,
          user_id,
        },
        (error as Error).stack,
      );
      throw new UnauthorizedException(SYS_MESSAGES.INVALID_ACCESS_TOKEN);
    }

    // Blacklist Access Token
    await this.blacklistService.blacklistToken(access_token, decoded);
  }

  // Refreshes the Access Token and rotates the Refresh Token
  async refreshToken(refresh_token?: string) {
    const { sub: user_id } = await this.validateRefreshToken(refresh_token);

    const user = await this.userService.getById({
      id: user_id,
    });

    this.userService.validateUserStatus(user);

    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    try {
      // Replace the old hash with the new one
      await this.authSessionsService.update(
        this.encryptionService.hash(refresh_token!),
        this.encryptionService.hash(tokens.refresh_token),
        user_id,
      );
      this.logger.audit(LOG_MESSAGES.AUTH.REFRESH_TOKEN_ROTATED(user_id), {
        event: LOG_EVENTS.AUTH_REFRESH_TOKEN_ROTATED,
      });
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        // Revoke all sessions and force logout from all devices when a reused or invalid token is detected.
        await this.authSessionsService.deleteAll(user_id);
        this.logger.security(LOG_MESSAGES.AUTH.REFRESH_TOKEN_REUSE(user_id), {
          event: LOG_EVENTS.AUTH_REFRESH_TOKEN_REUSE,
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

    if (!user || user.is_email_verified) {
      return;
    }

    await this.generateAndSendToken(user, TokenType.EMAIL_VERIFICATION);
  }

  async verifyEmail(rawToken: string) {
    const user = await this.validateAndDeleteToken(
      rawToken,
      TokenType.EMAIL_VERIFICATION,
    );

    // Update the user
    await this.userService.update(user.id, {
      is_email_verified: true,
    });

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
    await this.validateAndDeleteToken(dto.token, TokenType.PASSWORD_RESET);

    // Hash the new password
    const salt_rounds = this.configService.getOrThrow<number>(
      'AUTH.BCRYPT_SALT_ROUNDS',
    );
    const hashedPassword = await bcrypt.hash(dto.new_password, salt_rounds);

    const user = await this.validateAndDeleteToken(
      dto.token,
      TokenType.PASSWORD_RESET,
    );

    // Update user and FORCE LOGOUT of all devices
    await this.dataSource.transaction(async (manager) => {
      await this.userService.update(
        user.id,
        { password: hashedPassword },
        manager,
      );
      await this.authSessionsService.deleteAll(user.id, manager);
    });

    this.logger.audit(LOG_MESSAGES.AUTH.PASSWORD_RESET(user.id), {
      event: LOG_EVENTS.AUTH_PASSWORD_RESET,
    });
  }

  // PRIVATE METHODS

  private async sessionManagementWithTokenGeneration(user: UserEntity) {
    // Session Management
    const sessions = await this.authSessionsService.findAll(user.id);

    const sessionLimit =
      this.configService.getOrThrow<number>('AUTH.SESSION_LIMIT');

    if (sessions.length >= sessionLimit) {
      // Evict oldest session if limit reached
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

    // Generate and persist new session
    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    await this.authSessionsService.create(
      this.encryptionService.hash(tokens.refresh_token),
      user.id,
    );

    this.logger.audit(LOG_MESSAGES.AUTH.LOGIN_SUCCESS(user.id), {
      email: user.email,
      event: LOG_EVENTS.AUTH_LOGIN_SUCCESS,
    });

    return {
      tokens,
      user,
    };
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
    // Delete any existing unused tokens of this type to prevent spam
    await this.authTokenRepository.deleteByType(user.id, type, manager);

    // Generate secure 64-character hex string
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = this.encryptionService.hash(rawToken);

    // Set Expiration
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

    //  Send the Email
    const jobPayload: IMailJob<IAuthTokenContext> = {
      user: {
        name: user.name,
        email: user.email,
      },
      context: {
        rawToken,
      },
    };

    if (type === TokenType.EMAIL_VERIFICATION) {
      await this.mailQueue.add(MailJobName.SEND_VERIFICATION, jobPayload, {
        jobId: `verification-${user.id}-${Date.now()}`,
      });
    } else {
      await this.mailQueue.add(MailJobName.SEND_PASSWORD_RESET, jobPayload, {
        jobId: `password-reset-${user.id}-${Date.now()}`,
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

    // Burn the token so it can never be used again
    await this.authTokenRepository.delete(tokenRecord.id);

    return tokenRecord.user;
  }
}
