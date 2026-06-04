import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

import { AuthJwtPayload } from '../../../../../../types/dist/common';
import { IAuthenticatedSocket } from '../../../common/interfaces/auth.interface';
import { AppLogger } from '../../../common/logger/logger.service';
import { LOG_EVENTS } from '../../../constants/log_events';
import { LOG_MESSAGES } from '../../../constants/log_messages';
import * as SYSTEM_MESSAGES from '../../../constants/system_messages';

@Injectable()
export class WsGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(WsGuard.name);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient<IAuthenticatedSocket>();

    // Extract token from Handshake
    const token = this.extractToken(client);

    if (!token) {
      throw new WsException(SYSTEM_MESSAGES.INVALID_TOKEN);
    }

    try {
      // Verify Token
      const payload = await this.jwtService.verifyAsync<AuthJwtPayload>(token);

      client['user'] = payload;

      return true;
    } catch (err) {
      this.logger.error(
        LOG_MESSAGES.WS.AUTH_ERROR((err as Error).message),
        {
          event: LOG_EVENTS.WS_AUTH_ERROR,
        },
        (err as Error).stack,
      );
      throw new WsException(SYSTEM_MESSAGES.UNAUTHORIZED);
    }
  }

  private extractToken(client: Socket) {
    const authHeader = client.handshake.headers.authorization;
    if (authHeader && authHeader.split(' ')[0] === 'Bearer') {
      return authHeader.split(' ')[1] ?? undefined;
    }

    return undefined;
  }
}
