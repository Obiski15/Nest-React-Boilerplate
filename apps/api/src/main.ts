import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import { AppModule } from './app.module';
import { AppLogger } from './common/logger/logger.service';
import { LOG_EVENTS } from './constants/log_events';
import { LOG_MESSAGES } from './constants/log_messages';
import * as SYS_MESSAGES from './constants/system_messages';

let logger: AppLogger;

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  const configService = app.get(ConfigService);
  logger = app.get(AppLogger);
  logger.setContext('Application');

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.setGlobalPrefix('api', { exclude: ['docs', 'health'] });

  app.set('trust proxy', 1);

  app.use(cookieParser());

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || [];

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(SYS_MESSAGES.NOT_ALLOWED_CORS_ORIGIN));
      }
    },
    credentials: true,
  });

  app.use(helmet());

  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    app.use(
      morgan('dev', {
        stream: {
          write: (message) =>
            logger.http(message.trim(), { event: LOG_EVENTS.HTTP_REQUEST_IN }),
        },
      }),
    );
  }

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Use Winston for logging
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  // docs setup
  const config = new DocumentBuilder()
    .setTitle('Project Boilerplate API')
    .setDescription(
      'Boilerplate API. Provides authentication and user management',
    )
    .setVersion('1.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'Enter Access token',
    })
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('docs', app, documentFactory);

  const port = configService.get<number>('PORT');
  await app.listen(port as number);

  logger.log(
    `
      ${LOG_MESSAGES.SYSTEM.STARTUP}
      Environment: ${configService.get<string>('NODE_ENV')}
      API: http://localhost:${port}
      API Docs: http://localhost:${port}/docs
    `,
    {
      event: LOG_EVENTS.APPLICATION_STARTUP,
    },
  );
}

bootstrap().catch((e) => {
  logger.error(LOG_MESSAGES.SYSTEM.ERROR, {
    event: LOG_EVENTS.APPLICATION_ERROR,
    error: e instanceof Error ? e.message : e,
  });
  process.exit(1);
});
