import { ClientType } from '../enums';
import { UserRecord } from '../user';

export type TokenPair = {
  access_token: string;
  refresh_token?: string;
};

export type AuthChallengeResponse = {
  requires_2fa: true;
  temp_token: string;
  message: string;
};

export type AuthSessionResponse = {
  tokens: TokenPair;
  user?: UserRecord;
};

export type LoginRequest = {
  email: string;
  password: string;
  client_id: ClientType;
};

export type RegisterRequest = {
  name: string;
  email: string;
  password: string;
  client_id: ClientType;
};

export type EmailRequest = {
  email: string;
};

export type VerifyEmailRequest = {
  token: string;
};

export type ResetPasswordRequest = {
  token: string;
  new_password: string;
};

export type LogoutRequest = {
  client_id: ClientType;
  refresh_token?: string;
};

export type RefreshRequest = {
  client_id: ClientType;
  refresh_token?: string;
};

export type TokenRequest = {
  temp_token: string;
};

export interface TwoFactorVerificationRequest {
  code: string;
  client_id: ClientType;
}

export interface TwoFactorAuthenticationRequest extends TwoFactorVerificationRequest {
  temp_token: string;
}

export interface RecoveryCodeRequest extends TokenRequest {
  recovery_code: string;
  client_id: ClientType;
}

export type SessionFilters = {
  page?: number;
  limit?: number;
  search?: string;
  sortOrder?: 'ASC' | 'DESC';
  createdAfter?: string | Date;
};

export type UnifiedLoginResponse = AuthSessionResponse | AuthChallengeResponse;
