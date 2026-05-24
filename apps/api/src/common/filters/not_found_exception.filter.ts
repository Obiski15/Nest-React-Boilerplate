import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  NotFoundException,
} from '@nestjs/common';
import { Response } from 'express';

import { ErrorResponse } from '@app/types';

import * as SYS_MESSAGES from '../../constants/system_messages';

@Catch(NotFoundException)
export class NotFoundExceptionFilter implements ExceptionFilter {
  catch(exception: NotFoundException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();

    const body: ErrorResponse = {
      error: {
        code: status,
        type: exception.constructor.name,
        path: ctx.getRequest<Request>().url,
        message: SYS_MESSAGES.NOT_FOUND,
      },
    };
    response.status(status).json(body);
  }
}
