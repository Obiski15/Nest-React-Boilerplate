import { UserRole } from '../enums';

export type AuthJwtPayload = {
  sub: string;
  email: string;
  role: UserRole;
  exp?: number;
  iat?: number;
  jti?: string;
  is_temp_2fa?: boolean;
};

export type JwtPayload = AuthJwtPayload;

export type SuccessResponse<T = Record<string, unknown>> = {
  status: 'Success';
  message: string;
  data: T | null;
  meta?: PageMeta;
  links?: Record<string, unknown>;
};

export type ErrorResponse = {
  error: {
    code: number;
    path: string;
    type: string;
    message: string | string[];
  };
};

export type PageMetaInput = {
  total: number;
  page: number;
  limit: number;
};

export type PageMeta = PageMetaInput & {
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};
