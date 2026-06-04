import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtSignOptions } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BlacklistModule } from '../../common/blacklist/blacklist.module';
import { MailModule } from '../../common/mail/mail.module';
import { NotificationModule } from '../notification/notification.module';
import { UserModule } from '../user/user.module';
import { AuthController } from './controllers/auth.controller';
import { AuthSessionsEntity } from './entities/auth_sessions.entity';
import { AuthTokenEntity } from './entities/auth_token.entity';
import { AuthSessionsRepository } from './repository/auth_sessions.repository';
import { AuthTokenRepository } from './repository/auth_token.repository';
import { AuthSessionsService } from './services/auth_sessions.service';
import { AuthService } from './services/auth.service';
import { CookieService } from './services/cookie.service';
import { TwoFactorService } from './services/two_factor.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([AuthSessionsEntity, AuthTokenEntity]),
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT.ACCESS_SECRET'),
        signOptions: {
          expiresIn: config.get<JwtSignOptions['expiresIn']>(
            'JWT.ACCESS_EXPIRES_IN',
          ),
        },
      }),
    }),
    NotificationModule,
    BlacklistModule,
    UserModule,
    MailModule,
  ],
  providers: [
    AuthTokenRepository,
    AuthSessionsRepository,
    AuthSessionsService,
    CookieService,
    AuthService,
    TwoFactorService,
  ],
  controllers: [AuthController],
  exports: [AuthService, TwoFactorService],
})
export class AuthModule {}
