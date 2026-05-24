export default () => ({
  NODE_ENV: process.env.NODE_ENV || 'development',
  APP: {
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
    NAME: process.env.APP_NAME || 'Boilerplate API',
    LOGO_URL: process.env.APP_LOGO_URL || '',
    ADDRESS: process.env.APP_ADDRESS || '',
  },

  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3001,

  DATABASE: {
    NAME: process.env.DB_NAME || '',
    HOST: process.env.DB_HOST || '',
    PORT: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
    USERNAME: process.env.DB_USERNAME || '',
    PASSWORD: process.env.DB_PASSWORD || '',
  },

  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || '',

  JWT: {
    ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || '',
    REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || '',
    TEMP_2FA_SECRET: process.env.JWT_TEMP_2FA_SECRET || '',
    TEMP_2FA_TOKEN_EXPIRES_IN: process.env.JWT_TEMP_2FA_EXPIRES_IN || '5m',
    ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '1d',
  },

  COOKIE: {
    REFRESH_TOKEN_EXPIRES_IN: process.env.COOKIE_REFRESH_TOKEN_EXPIRES_IN
      ? parseInt(process.env.COOKIE_REFRESH_TOKEN_EXPIRES_IN, 10)
      : 24 * 60 * 60 * 1000, // 1 day
  },

  REDIS: {
    URL: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`,
    HOST: process.env.REDIS_HOST || 'localhost',
    PORT: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379,
    PASSWORD: process.env.REDIS_PASSWORD || '',
  },

  AUTH: {
    SESSION_LIMIT: 5,
    BCRYPT_SALT_ROUNDS: 10,
    PASSWORD_RESET_TOKEN_EXPIRES_IN: 0.25, // 15 minutes
    EMAIL_VERIFICATION_TOKEN_EXPIRES_IN: 24,
  },

  MAIL: {
    ACCOUNT: process.env.MAIL_ACCOUNT || '',
    GMAIL: {
      USER: process.env.GMAIL_USER || '',
      PASS: process.env.GMAIL_PASS || '',
    },
    MAILTRAP: {
      USER: process.env.MAILTRAP_USER || '',
      PASS: process.env.MAILTRAP_PASS || '',
    },
  },
});
