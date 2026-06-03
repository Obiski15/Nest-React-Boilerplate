export interface IRetryOptions {
  retries?: number;
  delay?: number;
  operation?: string;
  shouldRetry?: (error: unknown) => boolean;
}
