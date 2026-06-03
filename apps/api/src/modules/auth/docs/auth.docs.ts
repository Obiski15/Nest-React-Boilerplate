import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import * as SYS_MESSAGES from '../../../constants/system_messages';

// AUTH ROUTES

export function ApiRegister() {
  return applyDecorators(
    ApiOperation({ summary: 'Register a new user account' }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: SYS_MESSAGES.USER_REGISTERED,
    }),
    ApiConflictResponse({ description: SYS_MESSAGES.EMAIL_ALREADY_EXISTS }),
    ApiBadRequestResponse({ description: SYS_MESSAGES.BAD_REQUEST }),
  );
}

export function ApiLogin() {
  return applyDecorators(
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: 'Authenticate a user',
      description:
        'If 2FA is disabled, returns Access/Refresh tokens. If 2FA is enabled, returns a temporary token required for the /2fa/authenticate step.',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: SYS_MESSAGES.LOGIN_SUCCESS,
    }),
    ApiUnauthorizedResponse({ description: SYS_MESSAGES.INVALID_CREDENTIALS }),
    ApiBadRequestResponse({ description: SYS_MESSAGES.BAD_REQUEST }),
  );
}

export function ApiLogout() {
  return applyDecorators(
    HttpCode(HttpStatus.OK),
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Log out the current session and invalidate the refresh token',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: SYS_MESSAGES.LOGOUT_SUCCESS,
    }),
    ApiUnauthorizedResponse({
      description: SYS_MESSAGES.INVALID_REFRESH_TOKEN,
    }),
  );
}

export function ApiRefreshToken() {
  return applyDecorators(
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: 'Rotate the refresh token and issue a new access token',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: SYS_MESSAGES.TOKEN_REFRESHED,
    }),
    ApiUnauthorizedResponse({
      description: SYS_MESSAGES.INVALID_REFRESH_TOKEN,
    }),
  );
}

export function ApiResendVerification() {
  return applyDecorators(
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary: 'Resend the email verification link' }),
    ApiResponse({
      status: HttpStatus.OK,
      description: SYS_MESSAGES.VERIFICATION_EMAIL_SENT,
    }),
    ApiBadRequestResponse({ description: SYS_MESSAGES.BAD_REQUEST }),
  );
}

export function ApiVerifyEmail() {
  return applyDecorators(
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: 'Verify a user email address using the emailed token',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: SYS_MESSAGES.EMAIL_VERIFIED,
    }),
    ApiBadRequestResponse({ description: SYS_MESSAGES.INVALID_ACCESS_TOKEN }),
  );
}

export function ApiForgotPassword() {
  return applyDecorators(
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary: 'Request a password reset link' }),
    ApiResponse({
      status: HttpStatus.OK,
      description: SYS_MESSAGES.PASSWORD_RESET_EMAIL_SENT,
    }),
    ApiBadRequestResponse({ description: SYS_MESSAGES.BAD_REQUEST }),
  );
}

export function ApiResetPassword() {
  return applyDecorators(
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary: 'Reset the password using the emailed token' }),
    ApiResponse({
      status: HttpStatus.OK,
      description: SYS_MESSAGES.PASSWORD_RESET_SUCCESS,
    }),
    ApiBadRequestResponse({ description: SYS_MESSAGES.INVALID_ACCESS_TOKEN }),
  );
}

// SESSION ROUTES

export function ApiGetSessions() {
  return applyDecorators(
    ApiOperation({
      summary:
        'Get a paginated list of all active login sessions across devices',
    }),
    ApiBearerAuth(),
    ApiResponse({
      status: HttpStatus.OK,
      description: SYS_MESSAGES.SESSIONS_RETRIEVED,
    }),
    ApiUnauthorizedResponse({ description: SYS_MESSAGES.UNAUTHORIZED }),
  );
}

export function ApiRevokeAllSessions() {
  return applyDecorators(
    HttpCode(HttpStatus.NO_CONTENT),
    ApiOperation({
      summary: 'Forcefully log out of all active devices/sessions',
    }),
    ApiBearerAuth(),
    ApiResponse({
      status: HttpStatus.NO_CONTENT,
      description: SYS_MESSAGES.SESSIONS_REVOKED,
    }),
    ApiUnauthorizedResponse({ description: SYS_MESSAGES.UNAUTHORIZED }),
  );
}

export function ApiRevokeSession() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Revoke a specific active session',
      description: SYS_MESSAGES.SESSION_REVOKED,
    }),
    ApiParam({
      name: 'id',
      description: 'The unique ID of the session to revoke',
      example: 'a1b2c3d4-e5f6-7890-1234-56789abcdef0',
    }),
    ApiResponse({
      status: 200,
      description: SYS_MESSAGES.SESSION_REVOKED,
    }),
    ApiResponse({
      status: 401,
      description: SYS_MESSAGES.UNAUTHORIZED,
    }),
  );
}

// 2FA ROUTES
export function ApiAuthenticate2fa() {
  return applyDecorators(
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: 'Complete the login flow using a TOTP code and temporary token',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: SYS_MESSAGES.LOGIN_SUCCESS,
    }),
    ApiUnauthorizedResponse({
      description: 'Login session expired or ' + SYS_MESSAGES.INVALID_2FA_CODE,
    }),
    ApiBadRequestResponse({ description: SYS_MESSAGES.BAD_REQUEST }),
  );
}

export function ApiGenerate2fa() {
  return applyDecorators(
    ApiOperation({
      summary: 'Generate a 2FA QR code and manual entry keys for account setup',
    }),
    ApiBearerAuth(),
    ApiResponse({
      status: HttpStatus.OK,
      description: SYS_MESSAGES.TWO_FACTOR_SECRET_GENERATED,
      schema: {
        example: {
          qr_code_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
          manual_entry: {
            secret_key: 'JBSWY3DPEHPK3PXP',
            type: 'TOTP',
          },
        },
      },
    }),
    ApiUnauthorizedResponse({ description: SYS_MESSAGES.UNAUTHORIZED }),
  );
}

export function ApiTurnOn2fa() {
  return applyDecorators(
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary:
        'Verify the first TOTP code to officially enable 2FA on the account',
    }),
    ApiBearerAuth(),
    ApiResponse({
      status: HttpStatus.OK,
      description: SYS_MESSAGES.TWO_FACTOR_ENABLED,
    }),
    ApiBadRequestResponse({ description: SYS_MESSAGES.INVALID_2FA_CODE }),
    ApiUnauthorizedResponse({ description: SYS_MESSAGES.UNAUTHORIZED }),
  );
}

export function ApiDisable2fa() {
  return applyDecorators(
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: 'Disable 2FA by providing a valid TOTP code',
    }),
    ApiBearerAuth(),
    ApiResponse({
      status: HttpStatus.OK,
      description: SYS_MESSAGES.TWO_FACTOR_DISABLED,
    }),
    ApiBadRequestResponse({ description: SYS_MESSAGES.INVALID_2FA_CODE }),
    ApiUnauthorizedResponse({ description: SYS_MESSAGES.UNAUTHORIZED }),
  );
}

export function ApiRecover2fa() {
  return applyDecorators(
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: 'Emergency Login Bypass',
      description:
        'Allows a user to bypass standard 2FA by providing a single-use 10-character recovery code.',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: SYS_MESSAGES.LOGIN_SUCCESS,
    }),
    ApiBadRequestResponse({
      description: SYS_MESSAGES.NO_RECOVERY_CODES_LEFT,
    }),
    ApiUnauthorizedResponse({
      description:
        'Login session expired or ' + SYS_MESSAGES.INVALID_RECOVERY_CODE,
    }),
  );
}
