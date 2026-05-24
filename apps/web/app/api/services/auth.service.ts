import {
  AuthSessionResponse,
  ClientType,
  EmailRequest,
  LoginRequest,
  LogoutRequest,
  RecoveryCodeRequest,
  RefreshRequest,
  RegisterRequest,
  ResetPasswordRequest,
  SessionFilters,
  TwoFactorAuthenticationRequest,
  TwoFactorVerificationRequest,
  UnifiedLoginResponse,
  VerifyEmailRequest,
} from '@app/types';

import BaseService from './base.service';

class AuthService extends BaseService {
  constructor() {
    super('/auth');
  }

  register(data: Omit<RegisterRequest, 'client_id'>) {
    return this.post<RegisterRequest, AuthSessionResponse>('/register', {
      ...data,
      client_id: ClientType.WEB,
    });
  }

  login(data: Omit<LoginRequest, 'client_id'>) {
    return this.post<LoginRequest, UnifiedLoginResponse>('/login', {
      ...data,
      client_id: ClientType.WEB,
    });
  }

  logout(data?: { refresh_token?: string }) {
    return this.post<LogoutRequest, void>('/logout', {
      client_id: ClientType.WEB,
      ...data,
    });
  }

  refresh() {
    return this.post<RefreshRequest, { tokens: AuthSessionResponse['tokens'] }>(
      '/refresh',
      { client_id: ClientType.WEB },
    );
  }

  resendVerification(data: EmailRequest) {
    return this.post<EmailRequest, void>('/verify-email/resend', data);
  }

  verifyEmail(data: VerifyEmailRequest) {
    return this.post<VerifyEmailRequest, void>('/verify-email', data);
  }

  forgotPassword(data: EmailRequest) {
    return this.post<EmailRequest, void>('/forgot-password', data);
  }

  resetPassword(data: ResetPasswordRequest) {
    return this.post<ResetPasswordRequest, void>('/reset-password', data);
  }

  getSessions(filters?: SessionFilters) {
    return this.get<unknown>('/sessions', { params: filters });
  }

  revokeAllSessions() {
    return this.delete<void>('/sessions');
  }

  authenticate2fa(data: Omit<TwoFactorAuthenticationRequest, 'client_id'>) {
    return this.post<TwoFactorAuthenticationRequest, AuthSessionResponse>(
      '/2fa/authenticate',
      {
        ...data,
        client_id: ClientType.WEB,
      },
    );
  }

  generateTwoFactorSecret() {
    return this.get<{
      qr_code_url: string;
      manual_entry: {
        type: string;
        secret_key: string;
      };
    }>('/2fa/generate');
  }

  turnOnTwoFactorAuthentication(
    data: Omit<TwoFactorVerificationRequest, 'client_id'>,
  ) {
    return this.post<TwoFactorVerificationRequest, { backup_codes: string[] }>(
      '/2fa/turn-on',
      { ...data, client_id: ClientType.WEB },
    );
  }

  disableTwoFactorAuthentication(
    data: Omit<TwoFactorVerificationRequest, 'client_id'>,
  ) {
    return this.post<TwoFactorVerificationRequest, void>('/2fa/disable', {
      ...data,
      client_id: ClientType.WEB,
    });
  }

  authenticateWithRecoveryCode(data: Omit<RecoveryCodeRequest, 'client_id'>) {
    return this.post<RecoveryCodeRequest, AuthSessionResponse>('/2fa/recover', {
      ...data,
      client_id: ClientType.WEB,
    });
  }
}

export const authService = new AuthService();
