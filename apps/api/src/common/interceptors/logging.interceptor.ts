import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ClsService } from 'nestjs-cls';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import { LOG_EVENTS } from '../../constants/log_events';
import { LOG_MESSAGES } from '../../constants/log_messages';
import { AppLogger } from '../logger/logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    private readonly logger: AppLogger,
    private readonly cls: ClsService,
  ) {
    logger.setContext(LoggingInterceptor.name);
  }

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const { v7 } = (await import('uuid')) as { v7: () => string };

    const method = request.method;
    const originalUrl = request.originalUrl;
    const ip = request.ip;
    const body = (request as unknown as Record<string, unknown>).body;
    const query = request.query;
    const params = request.params;
    const userAgent = request.get('user-agent') ?? '';
    const controllerName = context.getClass().name;
    const handlerName = context.getHandler().name;
    const startAt = Date.now();

    const requestId = v7();

    this.cls.set('request_id', requestId);
    this.cls.set('user_agent', userAgent);
    this.cls.set('ip', ip);

    // Inbound log
    this.logger.log(LOG_MESSAGES.HTTP.REQUEST_IN(method, originalUrl), {
      event: LOG_EVENTS.HTTP_REQUEST_IN,
      controller: controllerName,
      handler: handlerName,
      ip,
      request_id: requestId,
      userAgent,
      query,
      params,
      body,
    });

    return next.handle().pipe(
      // Success log
      tap((responseBody) => {
        const duration = Date.now() - startAt;
        const { statusCode } = response;

        this.logger.log(
          LOG_MESSAGES.HTTP.RESPONSE_OUT(
            method,
            originalUrl,
            statusCode,
            duration,
          ),
          {
            event: LOG_EVENTS.HTTP_RESPONSE_OUT,
            controller: controllerName,
            handler: handlerName,
            statusCode,
            duration: `${duration}ms`,
            response: responseBody,
          },
        );
      }),

      // Error log
      catchError((error: unknown) => {
        const duration = Date.now() - startAt;
        const statusCode =
          typeof error === 'object' && error !== null && 'status' in error
            ? (error as { status: number }).status
            : 500;

        this.logger.error(
          LOG_MESSAGES.HTTP.ERROR(method, originalUrl, statusCode, duration),
          {
            event: LOG_EVENTS.HTTP_ERROR,
            controller: controllerName,
            handler: handlerName,
            statusCode,
            duration: `${duration}ms`,
          },
          error instanceof Error ? error.stack : JSON.stringify(error),
        );

        return throwError(() => error);
      }),
    );
  }
}
