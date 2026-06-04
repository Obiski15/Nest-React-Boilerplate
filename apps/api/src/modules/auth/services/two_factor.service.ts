import * as crypto from 'crypto';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { authenticator } from '@otplib/preset-default';
import * as qrcode from 'qrcode';

import { NotificationChannel } from '@app/types';

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

@Injectable()
export class TwoFactorService {
  private readonly frontend_url: string;

  constructor(
    private readonly notificationService: NotificationService,
    private readonly encryptionService: EncryptionService,
    private readonly templateService: TemplateService,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly logger: AppLogger,
  ) {
    this.frontend_url =
      this.configService.getOrThrow<string>('APP.FRONTEND_URL');
    this.logger.setContext(TwoFactorService.name);
  }

  async generateTwoFactorSecret(user: UserEntity) {
    // Generate secure secret
    const secret = authenticator.generateSecret();

    // Format URL for Authenticator
    const appName = this.configService.getOrThrow<string>('APP.NAME');
    const otpAuthUrl = authenticator.keyuri(user.email, appName, secret);

    const encryptedSecret = this.encryptionService.encrypt(secret);

    //  Save secret to DB
    await this.userService.update(user.id, {
      two_factor_secret: encryptedSecret,
    });

    return {
      secret,
      otpAuthUrl,
    };
  }

  async generateQrCodeDataURL(otpAuthUrl: string) {
    return await qrcode.toDataURL(otpAuthUrl);
  }

  async turnOnTwoFactorAuthentication(user: UserEntity, code: string) {
    const userWithSecret = await this.userService.getById({
      id: user.id,
      options: { select: ['id', 'two_factor_secret'] },
    });

    if (!userWithSecret?.two_factor_secret) {
      throw new BadRequestException(
        SYS_MESSAGES.TWO_FACTOR_SECRET_NOT_GENERATED,
      );
    }

    const decryptedSecret = this.encryptionService.decrypt(
      userWithSecret.two_factor_secret,
    );

    // Validate 6-digit code
    const isCodeValid = authenticator.verify({
      token: code,
      secret: decryptedSecret,
    });

    if (!isCodeValid) {
      this.logger.audit(LOG_MESSAGES.AUTH.TWO_FACTOR_FAILED(user.id), {
        event: LOG_EVENTS.AUTH_2FA_FAILED,
      });
      throw new BadRequestException(SYS_MESSAGES.INVALID_2FA_CODE);
    }

    // Generate 10 random recovery codes
    const plainTextCodes: string[] = [];
    const hashedCodes: string[] = [];

    for (let i = 0; i < 10; i++) {
      // Generates a random 10-character string
      const rawCode = crypto.randomBytes(5).toString('hex');
      plainTextCodes.push(rawCode);

      // Hash for secure database storage
      hashedCodes.push(this.encryptionService.hash(rawCode));
    }

    // enable 2FA
    await this.userService.update(user.id, {
      is_two_factor_enabled: true,
      two_factor_recovery_codes: hashedCodes,
    });

    const template = this.templateService.render(
      TEMPLATE_NAMES.TWO_FACTOR_ENABLED,
      {
        user: { name: user.name, email: user.email },
        action_url: this.frontend_url,
      },
    );

    await this.notificationService.dispatch({
      event_type: NotificationEventType.TWO_FACTOR_ENABLED,
      title: NotificationTitle.TWO_FACTOR_ENABLED,
      override_channels: [NotificationChannel.EMAIL],
      user_id: user.id,
      message: template,
    });

    this.logger.audit(LOG_MESSAGES.AUTH.TWO_FACTOR_ENABLED(user.id), {
      event: LOG_EVENTS.AUTH_2FA_ENABLED,
    });

    return plainTextCodes;
  }

  async disableTwoFactorAuthentication(userId: string, code: string) {
    // Verify code
    const isCodeValid = await this.verifyTwoFactorCode(userId, code);

    if (!isCodeValid) {
      this.logger.security(
        LOG_MESSAGES.AUTH.TWO_FACTOR_DISABLED_FAILED(userId),
        {
          event: LOG_EVENTS.AUTH_2FA_DISABLED_FAILED,
        },
      );
      throw new BadRequestException(SYS_MESSAGES.INVALID_2FA_CODE);
    }

    // Wipe secret and flip the boolean
    await this.userService.update(userId, {
      is_two_factor_enabled: false,
      two_factor_secret: null,
    });

    const user = await this.userService.getById({ id: userId });

    const template = this.templateService.render(
      TEMPLATE_NAMES.TWO_FACTOR_DISABLED,
      {
        user: { name: user.name, email: user.email },
        action_url: `${this.frontend_url}/settings`,
      },
    );

    await this.notificationService.dispatch({
      event_type: NotificationEventType.TWO_FACTOR_DISABLED,
      override_channels: [NotificationChannel.EMAIL],
      title: NotificationTitle.TWO_FACTOR_DISABLED,
      user_id: user.id,
      message: template,
    });

    this.logger.audit(LOG_MESSAGES.AUTH.TWO_FACTOR_DISABLED(userId), {
      event: LOG_EVENTS.AUTH_2FA_DISABLED,
    });
  }

  async verifyTwoFactorCode(userId: string, code: string) {
    const user = await this.userService.getById({
      id: userId,
      options: { select: ['id', 'two_factor_secret'] },
    });

    if (!user?.two_factor_secret) return false;

    const decryptedSecret = this.encryptionService.decrypt(
      user.two_factor_secret,
    );

    return authenticator.verify({
      token: code,
      secret: decryptedSecret,
    });
  }
}
