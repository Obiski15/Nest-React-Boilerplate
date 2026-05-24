export const LOG_MESSAGES = {
  SYSTEM: {
    REDIS_ERROR: (err: string) => `[CORE_WARN] Redis Cache/Queue error: ${err}`,
    DB_CONNECTED: '[CORE] Database connection established successfully',
    DB_CONNECTION_LOST: '[CRITICAL] Database connection lost!',
    STARTUP: 'Application startup complete!',
    ERROR: 'Application startup failure',
  },

  HTTP: {
    REQUEST_IN: (method: string, url: string) => `→ ${method} ${url}`,
    RESPONSE_OUT: (
      method: string,
      url: string,
      statusCode: number,
      duration: number,
    ) => `← ${method} ${url} ${statusCode} [${duration}ms]`,
    ERROR: (
      method: string,
      url: string,
      statusCode: number,
      duration: number,
    ) => `✕ ${method} ${url} ${statusCode} [${duration}ms]`,
  },

  RETRY: {
    ATTEMPT_FAILED: (attempt: number, operation: string) =>
      `Retry attempt ${attempt} failed for operation: ${operation}`,
    EXHAUSTED: (retries: number, operation: string) =>
      `All ${retries} retry attempts exhausted for operation: ${operation}`,
  },

  ENCRYPTION: {
    INVALID_PAYLOAD: 'Invalid encryption payload format.',
    FAILURE: (error: string) => `Encryption failed. Error: ${error}`,
    SUCCESS: 'Encryption successful.',
  },

  DECRYPTION: {
    FAILURE: (error: string) => `Decryption failed. Error: ${error}`,
    SUCCESS: 'Decryption successful.',
  },

  USER: {
    REGISTERED: (email: string) =>
      `User account successfully registered: [${email}]`,
    REGISTRATION_FAILED: (email: string) =>
      `Failed to register user account: [${email}]`,
    INACTIVE: (email: string) => `User account is inactive: [${email}]`,
    CREATED: (userId: string) => `User account created: [${userId}]`,
    UPDATED: (userId: string) =>
      `User profile successfully updated: [${userId}]`,
    UPDATE_FAILED: (userId: string, reason: string) =>
      `Failed to update user [${userId}]. Reason: ${reason}`,
    DELETED: (userId: string) => `User account soft-deleted: [${userId}]`,
    ACCESS_DENIED: (userId: string, reason: string) =>
      `System blocked access for user [${userId}]. Reason: ${reason}`,
    NOT_FOUND: () =>
      `User lookup failed: Account does not exist in the database.`,
  },

  SESSION: {
    CREATED: (userId: string) =>
      `New active session established for user: [${userId}]`,
    DELETED: (userId: string) =>
      `Session successfully terminated for user: [${userId}]`,
    REVOKED_ALL: (userId: string) =>
      `CRITICAL: All active sessions forcefully revoked for user: [${userId}]`,
    UPDATE_FAILED: (userId: string) =>
      `Failed to rotate session. Token missing or invalid for user: [${userId}]`,
  },

  AUTH: {
    LOGIN_SUCCESS: (userId: string) =>
      `User successfully authenticated: [${userId}]`,
    LOGIN_FAILURE: (identifier: string) =>
      `Failed login attempt for identifier: [${identifier}]`,
    SESSION_EVICTED: (userId: string) =>
      `Active session limit reached. Oldest session evicted for user: [${userId}]`,
    LOGOUT: (userId: string) =>
      `User successfully terminated session: [${userId}]`,
    TOKEN_DECODE_FAILED: (token: string) =>
      `Failed to decode token: [${token}]`,
    UNAUTHORIZED_ACCESS: (action: string) =>
      `Unauthorized/invalid access attempt detected during action: [${action}]`,
    REFRESH_TOKEN_ROTATED: (userId: string) =>
      `Refresh token successfully rotated for user: [${userId}]`,
    REFRESH_TOKEN_REUSE: (userId: string) =>
      `Refresh token reuse detected! [${userId}]`,
    TOKEN_BLACKLIST_FAILED: (token: string) =>
      `Failed to blacklist token: [${token}]`,
    BLACKLISTED_TOKEN_REUSE: (userId: string) =>
      `Blacklisted token reuse detected for user: [${userId}]`,
    TOKEN_BLACKLISTED: (userId: string) =>
      `Token blacklisted for user: [${userId}]`,
    TOKEN_REUSE_CHECK_FAILED: (token: string) =>
      `Failed to check token reuse: [${token}]`,
    EMAIL_VERIFIED: (userId: string) =>
      `User email successfully verified: [${userId}]`,
    EMAIL_VERIFICATION_FAILED: (email: string) =>
      `Failed email verification attempt for email: [${email}]`,
    PASSWORD_RESET_REQUESTED: (email: string) =>
      `Password reset requested for email: [${email}]`,
    PASSWORD_RESET: (userId: string) =>
      `Password successfully reset for user: [${userId}]`,
    TWO_FACTOR_CHALLENGE: (userId: string) =>
      `2FA challenge initiated for user: [${userId}]`,
    TWO_FACTOR_FAILED: (userId: string) =>
      `2FA verification failed for user: [${userId}]`,
    TWO_FACTOR_SUCCESS: (userId: string) =>
      `2FA verification successful for user: [${userId}]`,
    TWO_FACTOR_ENABLED: (userId: string) =>
      `Two-factor authentication enabled for user: [${userId}]`,
    TWO_FACTOR_DISABLED: (userId: string) =>
      `Two-factor authentication disabled for user: [${userId}]`,
    TWO_FACTOR_DISABLED_FAILED: (userId: string) =>
      `Failed attempt to disable 2FA for user: [${userId}]`,
    TWO_FACTOR_RECOVERY_FAILED: (userId: string) =>
      `Failed attempt to use 2FA recovery code for user: [${userId}]`,
    TWO_FACTOR_RECOVERY_USED: (userId: string) =>
      `2FA recovery code successfully used for user: [${userId}]`,
  },

  MAIL: {
    WELCOME_EMAIL_SENT: (email: string) => `Welcome email sent to ${email}`,
    VERIFICATION_EMAIL_SENT: (email: string, verificationLink: string) =>
      `Email Verification link sent to ${email}: ${verificationLink}`,
    PASSWORD_RESET_EMAIL_SENT: (email: string, resetLink: string) =>
      `Password reset link sent to ${email}: ${resetLink}`,
    FAILED: 'Failed to send email',
  },

  BACKGROUND_JOBS: {
    UNKNOWN_JOB_NAME: (jobName: string) =>
      `Received job with unknown name: [${jobName}]`,
    BACKGROUND_JOB_FAILED: (
      jobName: string,
      jobId: string,
      attemptsMade: number,
      attemptsTotal: number,
    ) =>
      `Background job failed: [${jobName}] (ID: ${jobId}). Attempt ${attemptsMade}/${attemptsTotal}`,
  },
} as const;
