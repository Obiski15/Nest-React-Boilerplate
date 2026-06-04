import { BullModule } from '@nestjs/bullmq';
import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import KeyvRedis from '@keyv/redis';
import { ClsInterceptor, ClsModule } from 'nestjs-cls';

import { BlacklistModule } from './common/blacklist/blacklist.module';
import { PoliciesGuard } from './common/casl/guards/policies.guard';
import { CaslAbilityFactory } from './common/casl/services/casl.factory';
import { EncryptionModule } from './common/encryption/encryption.module';
import { GlobalExceptionFilter } from './common/filters/exception.filter';
import { NotFoundExceptionFilter } from './common/filters/not_found_exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggerModule } from './common/logger/logger.module';
import { MailModule } from './common/mail/mail.module';
import { RetryModule } from './common/retry/retry.module';
import { TemplateModule } from './common/templates/template.module';
import config from './config';
import { THROTTLE_OPTIONS } from './constants';
import { AuthModule } from './modules/auth/auth.module';
import { AuthGuard } from './modules/auth/guards/auth.guard';
import { HealthModule } from './modules/health/health.module';
import { NotificationModule } from './modules/notification/notification.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config],
    }),

    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
      },
    }),

    ThrottlerModule.forRoot({
      throttlers: [THROTTLE_OPTIONS.default],
    }),

    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: (configService: ConfigService) => ({
        stores: [new KeyvRedis(configService.get('REDIS.URL'))],
        ttl: 60000,
      }),

      inject: [ConfigService],
    }),

    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
    }),

    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return {
          connection: {
            host: config.get<string>('REDIS.HOST'),
            port: config.get<number>('REDIS.PORT'),
          },
          defaultJobOptions: {
            removeOnComplete: 1000, // keep last 1000 completed jobs
            removeOnFail: 5000, // Keep last 5000 failed jobs
            attempts: 3, // Retry 3 times on failure
            backoff: {
              type: 'exponential',
              delay: 1000,
            },
          },
        };
      },
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isDev = config.get<string>('NODE_ENV') === 'development';

        return {
          type: 'postgres',
          host: config.get<string>('DATABASE.HOST'),
          port: config.get<number>('DATABASE.PORT'),
          username: config.get<string>('DATABASE.USERNAME'),
          password: config.get<string>('DATABASE.PASSWORD'),
          database: config.get<string>('DATABASE.NAME'),

          // Auto-load entities from TypeOrmModule.forFeature() in all modules
          autoLoadEntities: true,

          // Only synchronize in development
          synchronize: isDev,

          // Automatically run pending migrations on application start in production
          migrationsRun: !isDev,

          // Migration configuration
          migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
          migrationsTableName: 'migrations',

          // SSL configuration for production databases
          ssl: config.get<boolean>('DATABASE.SSL')
            ? { rejectUnauthorized: false }
            : false,

          // Logging configuration
          logging: isDev ? true : ['error', 'warn', 'migration'],
        };
      },
    }),

    NotificationModule,
    EncryptionModule,
    BlacklistModule,
    TemplateModule,
    LoggerModule,
    HealthModule,
    RetryModule,
    MailModule,
    AuthModule,
  ],
  controllers: [],
  providers: [
    CaslAbilityFactory,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PoliciesGuard,
    },
    {
      provide: APP_FILTER,
      useClass: NotFoundExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ClsInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
