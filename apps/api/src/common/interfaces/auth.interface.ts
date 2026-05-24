import { Request } from 'express';

import type { AuthJwtPayload } from '@app/types';

export interface IAuthenticatedRequest extends Request {
  user: AuthJwtPayload;
}
