import { Injectable } from '@nestjs/common';

import { LOG_EVENTS } from '../../../constants/log_events';
import { LOG_MESSAGES } from '../../../constants/log_messages';
import { AppLogger } from '../../logger/logger.service';
import { IRetryOptions } from '../interfaces/retry.interface';

@Injectable()
export class RetryService {
  constructor(private readonly logger: AppLogger) {
    this.logger.setContext(RetryService.name);
  }

  async execute<T>(
    operation: () => Promise<T>,
    options?: IRetryOptions,
  ): Promise<T> {
    const retries = options?.retries ?? 3;
    const delay = options?.delay ?? 1000;
    const operationName = options?.operation ?? 'unknown_operation';

    // retry on any error unless specified
    const shouldRetry = options?.shouldRetry ?? (() => true);

    let lastError: unknown;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        // Check if we should retry this specific error
        if (!shouldRetry(error)) {
          throw error;
        }

        this.logger.warn(
          LOG_MESSAGES.RETRY.ATTEMPT_FAILED(attempt, operationName),
          {
            event: LOG_EVENTS.RETRY_ATTEMPT_FAILED,
            operation: operationName,
            attempt,
            retries,
            message: (error as Error).message,
          },
        );

        if (attempt < retries) {
          // randomizes the delay to prevent synchronized retries
          const jitter = Math.random() * 200;
          const backoff = delay * Math.pow(2, attempt - 1);
          await this.sleep(backoff + jitter);
        }
      }
    }

    this.logger.error(LOG_MESSAGES.RETRY.EXHAUSTED(retries, operationName), {
      event: LOG_EVENTS.RETRY_EXHAUSTED,
      operation: operationName,
    });

    throw lastError;
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
