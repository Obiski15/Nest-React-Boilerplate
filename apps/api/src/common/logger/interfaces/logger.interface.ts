import { LogEvent } from '../../../constants/log_events';

export interface ILogMeta {
  event: LogEvent;
  [key: string]: unknown;
}

export interface IAppWinstonLogger {
  info(message: string, meta?: ILogMeta): void;
  error(message: string, meta?: ILogMeta): void;
  warn(message: string, meta?: ILogMeta): void;
  debug(message: string, meta?: ILogMeta): void;
  verbose(message: string, meta?: ILogMeta): void;
  http(message: string, meta?: ILogMeta): void;
}
