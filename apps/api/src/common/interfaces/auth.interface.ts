import { Request } from 'express';
import { Socket } from 'socket.io';

import type { AuthJwtPayload } from '@app/types';

export interface IAuthenticatedRequest extends Request {
  user: AuthJwtPayload;
}

export interface IAuthenticatedSocket extends Socket {
  user: AuthJwtPayload;
}
