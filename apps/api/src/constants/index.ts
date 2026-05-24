export const SENSITIVE_KEYS = new Set([
  'password',
  'confirm_password',
  'token',
  'access_token',
  'refresh_token',
  'accessToken',
  'refreshToken',
  'secret',
  'authorization',
  'token',
  'new_password',
  'two_factor_secret',
  'two_factor_recovery_codes',
  'api_key',
]);

export const THROTTLE_OPTIONS = {
  default: {
    name: 'default',
    ttl: 60000,
    limit: 100,
  },

  auth: {
    name: 'auth',
    ttl: 60000,
    limit: 5,
  },

  search: {
    name: 'search',
    ttl: 10000,
    limit: 5,
  },

  webhooks: {
    name: 'webhooks',
    ttl: 60000,
    limit: 1000, // High ceiling to prevent dropped payment events
  },

  public: {
    name: 'public',
    ttl: 60000,
    limit: 30, // 1 request every 2 seconds avg
  },
};
