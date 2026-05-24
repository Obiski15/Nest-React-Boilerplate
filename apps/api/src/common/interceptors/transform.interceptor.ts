import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { instanceToPlain } from 'class-transformer';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { PageMeta, SuccessResponse } from '@app/types';

import { RESPONSE_MESSAGE } from '../decorators/response_message.decorator';

@Injectable()
export class TransformInterceptor<
  T extends Record<string, unknown>,
> implements NestInterceptor<T, SuccessResponse<T>> {
  constructor(private readonly reflector: Reflector) {}

  intercept(
    _context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<SuccessResponse<T>> {
    const message =
      this.reflector.get<string>(RESPONSE_MESSAGE, _context.getHandler()) ||
      'Success';

    return next.handle().pipe(
      map((payload) => {
        const serializedPayload =
          payload === null || payload === undefined
            ? null
            : (instanceToPlain(payload) as Record<string, unknown>);

        if (serializedPayload === null) {
          return {
            status: 'Success',
            message,
            data: null,
          };
        }

        const {
          meta,
          links,
          message: payloadMessage,
          ...others
        } = serializedPayload as Record<string, unknown> & {
          message?: string;
          meta?: PageMeta;
          links?: Record<string, unknown>;
        };

        const response: SuccessResponse<T> = {
          status: 'Success',
          message: payloadMessage || message || 'Success',
          data: others as T,
        };

        // Only include meta links if present in the payload
        if (meta !== undefined) response.meta = meta;
        if (links !== undefined) response.links = links;

        return response;
      }),
    );
  }
}
