import * as crypto from 'crypto';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { LOG_EVENTS } from '../../../constants/log_events';
import { LOG_MESSAGES } from '../../../constants/log_messages';
import * as SYS_MESSAGES from '../../../constants/system_messages';
import { AppLogger } from '../../logger/logger.service';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(EncryptionService.name);
    const secretKey = this.configService.getOrThrow<string>('ENCRYPTION_KEY');

    // Hash the secret key to guarantee it is exactly 32 bytes long
    this.key = crypto.createHash('sha256').update(secretKey).digest();
  }

  //  Encrypts plain text string into a secure, tamper-proof hex payload.
  encrypt(text: string) {
    try {
      const iv = crypto.randomBytes(12);
      const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = cipher.getAuthTag().toString('hex');

      this.logger.log(LOG_MESSAGES.ENCRYPTION.SUCCESS, {
        event: LOG_EVENTS.ENCRYPTION_SUCCESS,
      });

      // Return the complete payload separated by colons
      return `${iv.toString('hex')}:${authTag}:${encrypted}`;
    } catch (error) {
      this.logger.error(
        LOG_MESSAGES.ENCRYPTION.FAILURE((error as Error).message),
        {
          event: LOG_EVENTS.ENCRYPTION_FAILURE,
        },
        (error as Error).stack,
      );
      throw new InternalServerErrorException(
        SYS_MESSAGES.INTERNAL_SERVER_ERROR,
      );
    }
  }

  decrypt(encryptedPayload: string): string {
    if (!encryptedPayload) return encryptedPayload;

    try {
      // Split the payload into its components
      const parts = encryptedPayload.split(':');
      if (parts.length !== 3) {
        this.logger.error(LOG_MESSAGES.ENCRYPTION.INVALID_PAYLOAD, {
          event: LOG_EVENTS.INVALID_ENCRYPTION_PAYLOAD,
        });
        throw new InternalServerErrorException(
          SYS_MESSAGES.INTERNAL_SERVER_ERROR,
        );
      }

      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const encryptedText = parts[2];

      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);

      decipher.setAuthTag(authTag);

      // Decrypt the data
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      this.logger.log(LOG_MESSAGES.DECRYPTION.SUCCESS, {
        event: LOG_EVENTS.DECRYPTION_SUCCESS,
      });

      return decrypted;
    } catch (error) {
      this.logger.error(
        LOG_MESSAGES.DECRYPTION.FAILURE((error as Error).message),
        {
          event: LOG_EVENTS.DECRYPTION_FAILURE,
        },
        (error as Error).stack,
      );

      throw new InternalServerErrorException(
        SYS_MESSAGES.INTERNAL_SERVER_ERROR,
      );
    }
  }

  hash(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex');
  }

  compare(plainText: string, hash: string): boolean {
    const hashedText = this.hash(plainText);
    return hashedText === hash;
  }
}
