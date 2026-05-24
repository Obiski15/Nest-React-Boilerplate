import { Test, TestingModule } from '@nestjs/testing';

import { AppLogger } from '../../logger/logger.service';
import { RetryService } from './retry.service';

describe('RetryService', () => {
  let service: RetryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RetryService,
        {
          provide: AppLogger,
          useValue: {
            setContext: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RetryService>(RetryService);

    jest.useFakeTimers();
    jest.spyOn(global.Math, 'random').mockReturnValue(0.5);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should execute successfully on the first attempt', async () => {
    const operation = jest.fn().mockResolvedValue('success');

    const result = await service.execute(operation);

    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure and succeed on a subsequent attempt', async () => {
    const error = new Error('Temporary failure');
    const operation = jest
      .fn()
      .mockRejectedValueOnce(error)
      .mockRejectedValueOnce(error)
      .mockResolvedValue('success');

    const executePromise = service.execute(operation, {
      retries: 3,
      delay: 1000,
    });

    await jest.runAllTimersAsync();

    const result = await executePromise;

    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(3);
  });

  it('should exhaust all retries and throw the last error', async () => {
    const error = new Error('Persistent failure');
    const operation = jest.fn().mockRejectedValue(error);

    let caughtError: unknown;

    // Catch the error immediately to prevent the unhandled rejection warning
    const executePromise = service
      .execute(operation, { retries: 3, delay: 1000 })
      .catch((err) => {
        caughtError = err;
      });

    await jest.runAllTimersAsync();
    await executePromise; // Wait for the execution block to fully resolve

    expect(caughtError).toBe(error);
    expect(operation).toHaveBeenCalledTimes(3);
  });

  it('should not retry if shouldRetry returns false', async () => {
    const error = new Error('Fatal failure');
    const operation = jest.fn().mockRejectedValue(error);

    const shouldRetry = jest.fn(() => false);

    let caughtError: unknown;
    const executePromise = service
      .execute(operation, { shouldRetry })
      .catch((err) => {
        caughtError = err;
      });

    await jest.runAllTimersAsync();
    await executePromise;

    expect(caughtError).toBe(error);
    expect(operation).toHaveBeenCalledTimes(1);
    expect(shouldRetry).toHaveBeenCalledWith(error);
  });

  it('should use default options when none are provided', async () => {
    const error = new Error('Fail');
    const operation = jest.fn().mockRejectedValue(error);

    let caughtError: unknown;
    const executePromise = service.execute(operation).catch((err) => {
      caughtError = err;
    });

    await jest.runAllTimersAsync();
    await executePromise;

    expect(caughtError).toBe(error);
    expect(operation).toHaveBeenCalledTimes(3);
  });
});
