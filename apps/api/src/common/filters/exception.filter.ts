import { inspect } from 'util';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

import { ErrorResponse } from '@app/types';

import { LOG_EVENTS } from '../../constants/log_events';
import { AppLogger } from '../logger/logger.service';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private logger: AppLogger) {
    this.logger.setContext(GlobalExceptionFilter.name);
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'An unexpected error occurred';
    let type = 'InternalServerError';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      type = exception.constructor.name;

      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        // e.g. throw new HttpException('Custom message', 400)
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const body = exceptionResponse as Record<string, unknown>;
        // NestJS validation pipe returns { message: string[] }
        message = (body.message as string | string[]) ?? exception.message;
        // Allow the controller to override the error type
        if (body.error) type = body.error as string;
      }
    } else if (exception instanceof Error) {
      // Non-HTTP errors (e.g. database, runtime exceptions)
      message = exception.message;
    }

    // Always log unhandled / 5xx errors
    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      const stackOrDetails =
        exception instanceof Error
          ? exception.stack
          : inspect(exception, { depth: 3, colors: false });

      this.logger.error(
        `[${request.method}] ${request.url} → ${statusCode}`,
        {
          event: LOG_EVENTS.EXCEPTION,
        },
        stackOrDetails,
      );
    }

    const body: ErrorResponse = {
      error: {
        code: statusCode,
        type,
        path: request.url,
        message,
      },
    };

    response.status(statusCode).json(body);
  }
}
