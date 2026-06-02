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
import { DeviceService } from './device.service';

class AuthService extends BaseService {
  constructor() {
    super('/auth');
  }

  register(
    data: Omit<RegisterRequest, 'client_id' | 'device_id' | 'metadata'>,
  ) {
    return this.post<RegisterRequest, AuthSessionResponse>('/register', {
      ...data,
      client_id: ClientType.WEB,
      device_id: DeviceService.getDeviceId(),
      metadata: DeviceService.getDeviceMetadata(),
    });
  }

  login(data: Omit<LoginRequest, 'client_id' | 'device_id' | 'metadata'>) {
    return this.post<LoginRequest, UnifiedLoginResponse>('/login', {
      ...data,
      client_id: ClientType.WEB,
      device_id: DeviceService.getDeviceId(),
      metadata: DeviceService.getDeviceMetadata(),
    });
  }

  logout(data?: Omit<LogoutRequest, 'client_id' | 'device_id'>) {
    return this.post<LogoutRequest, void>('/logout', {
      client_id: ClientType.WEB,
      device_id: DeviceService.getDeviceId(),
      ...data,
    });
  }

  refresh() {
    return this.post<RefreshRequest, { tokens: AuthSessionResponse['tokens'] }>(
      '/refresh',
      {
        client_id: ClientType.WEB,
        device_id: DeviceService.getDeviceId(),
      },
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
    // TODO: pass device_id to log which device triggered the global revocation
    return this.delete<void>('/sessions');
  }

  authenticate2fa(
    data: Omit<
      TwoFactorAuthenticationRequest,
      'client_id' | 'device_id' | 'metadata'
    >,
  ) {
    return this.post<TwoFactorAuthenticationRequest, AuthSessionResponse>(
      '/2fa/authenticate',
      {
        ...data,
        client_id: ClientType.WEB,
        device_id: DeviceService.getDeviceId(),
        metadata: DeviceService.getDeviceMetadata(),
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
    // TODO: Include device_id to audit settings changes
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

  authenticateWithRecoveryCode(
    data: Omit<RecoveryCodeRequest, 'client_id' | 'device_id' | 'metadata'>,
  ) {
    return this.post<RecoveryCodeRequest, AuthSessionResponse>('/2fa/recover', {
      ...data,
      client_id: ClientType.WEB,
      device_id: DeviceService.getDeviceId(),
      metadata: DeviceService.getDeviceMetadata(),
    });
  }
}

export const authService = new AuthService();
