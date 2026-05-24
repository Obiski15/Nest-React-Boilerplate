import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { ClsService } from 'nestjs-cls';

import type {
  IAppWinstonLogger,
  ILogMeta,
} from './interfaces/logger.interface';

@Injectable()
export class AppLogger implements LoggerService {
  // Set by the consuming class via setContext()
  private context = 'App';

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: IAppWinstonLogger,
    private readonly cls: ClsService,
  ) {}

  // Context

  setContext(context: string): this {
    this.context = context;
    return this;
  }

  log(message: string, meta: ILogMeta) {
    this.logger.info(message, this.format({ context: this.context, ...meta }));
  }

  error(message: string, meta: ILogMeta, trace?: string) {
    this.logger.error(
      message,
      this.format({ context: this.context, trace, ...meta }),
    );
  }

  warn(message: string, meta: ILogMeta) {
    this.logger.warn(message, this.format({ context: this.context, ...meta }));
  }

  debug(message: string, meta: ILogMeta) {
    this.logger.debug(message, this.format({ context: this.context, ...meta }));
  }

  verbose(message: string, meta: ILogMeta) {
    this.logger.verbose(
      message,
      this.format({ context: this.context, ...meta }),
    );
  }

  //  Log an inbound HTTP request
  http(message: string, meta: ILogMeta) {
    this.logger.http(message, this.format({ context: this.context, ...meta }));
  }

  // Log a structured audit event. Useful for tracking who did what, and when
  audit(action: string, meta: ILogMeta) {
    this.logger.info(
      action,
      this.format({
        context: 'Audit',
        type: 'AUDIT',
        ...meta,
      }),
    );
  }

  // For suspicious activity
  security(
    message: string,
    meta: ILogMeta & {
      severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    },
  ) {
    this.logger.warn(
      message,
      this.format({
        context: 'Security',
        type: 'SECURITY',
        severity: meta.severity ?? 'HIGH',
        ...meta,
      }),
    );
  }

  private format(meta: ILogMeta): ILogMeta {
    return {
      ...meta,
      request_id: this.cls.get<string>('request_id'),
      ip: this.cls.get<string>('ip'),
      user_agent: this.cls.get<string>('user_agent'),
      timestamp: new Date().toISOString(),
    };
  }
}
