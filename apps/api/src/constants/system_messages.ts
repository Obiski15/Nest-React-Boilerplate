// GLOBAL SYSTEM ERRORS
export const INTERNAL_SERVER_ERROR =
  'Something went wrong on our end. Please try again later.';
export const BAD_REQUEST =
  'Please check the information provided and try again.';
export const NOT_FOUND = "We couldn't find what you were looking for.";
export const UNAUTHORIZED = 'Please log in to access this page.';
export const FORBIDDEN = "You don't have permission to do this.";
export const NOT_ALLOWED_CORS_ORIGIN =
  'This action was blocked for security reasons.';
export const TOO_MANY_REQUESTS =
  "You're doing that a bit too fast. Please wait a moment and try again.";

// AUTHENTICATION & SESSIONS
export const USER_REGISTERED =
  'Account created! Please check your email to activate it.';
export const ACCOUNT_DELETED = 'This account has been permanently deleted.';
export const EMAIL_NOT_VERIFIED =
  'Please verify your email address to continue.';
export const USER_REGISTRATION_FAILED =
  "We couldn't create your account right now. Please try again.";

export const LOGIN_SUCCESS = 'Welcome back!';
export const LOGOUT_SUCCESS = "You've been logged out.";
export const INVALID_CREDENTIALS =
  'The email or password you entered is incorrect.';
export const ACCOUNT_INACTIVE =
  'This account has been deactivated. Please contact support.';
export const TOKEN_REFRESHED = 'Session refreshed.';
export const INVALID_ACCESS_TOKEN =
  'Your session has expired. Please log in again.';
export const INVALID_TOKEN =
  'This link is invalid or has expired. Please request a new one.';
export const INVALID_REFRESH_TOKEN =
  'Your secure session has expired. Please log in again.';
export const VERIFICATION_EMAIL_SENT =
  "If an account exists, we've sent a verification link to that email.";
export const EMAIL_VERIFIED = 'Your email is verified. You can now log in.';
export const PASSWORD_RESET_EMAIL_SENT =
  "If that email matches an account, we've sent a password reset link.";
export const PASSWORD_RESET_SUCCESS =
  'Password updated successfully. You can now log in.';
export const SESSIONS_RETRIEVED = 'Active devices loaded.';
export const SESSIONS_REVOKED = "You've been signed out of all other devices.";
export const SESSION_REVOKED = 'This device has been signed out.';
export const LOGIN_SESSION_EXPIRED =
  'Your login session expired. Please sign in again.';

// 2FA
export const TWO_FACTOR_ENABLED = 'Two-factor authentication is now enabled.';
export const TWO_FACTOR_DISABLED =
  'Two-factor authentication has been disabled.';
export const TWO_FACTOR_SECRET_NOT_GENERATED =
  'Please set up your authenticator app before enabling 2FA.';
export const TWO_FACTOR_SECRET_GENERATED = 'Authenticator setup code created.';
export const REQUIRE_2FA = 'Please enter your authenticator code to continue.';
export const INVALID_2FA_CODE = 'That code is incorrect. Please try again.';
export const INVALID_RECOVERY_CODE = 'That recovery code is incorrect.';
export const NO_RECOVERY_CODES_LEFT =
  'You have no recovery codes left. Please generate a new set immediately.';

// USER MANAGEMENT
export const USER_CREATED = 'User added successfully.';
export const USER_RETRIEVED = 'User loaded.';
export const USERS_RETRIEVED = 'Users loaded.';
export const USER_UPDATED = 'Changes saved successfully.';
export const USER_DELETED = 'Account deleted successfully.';
export const EMAIL_ALREADY_EXISTS =
  'An account with this email already exists.';
export const USER_NOT_FOUND = "We couldn't find an account with those details.";
