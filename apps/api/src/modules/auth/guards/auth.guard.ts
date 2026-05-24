import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

import type { AuthJwtPayload } from '@app/types';

import { BlacklistService } from '../../../common/blacklist/services/blacklist.service';
import { IS_PUBLIC_KEY } from '../../../common/decorators/public.decorator';
import { IAuthenticatedRequest } from '../../../common/interfaces/auth.interface';
import * as SYS_MESSAGES from '../../../constants/system_messages';

function extractTokenFromHeader(request: Request): string | undefined {
  const [type, token] = request.headers.authorization?.split(' ') ?? [];
  return type === 'Bearer' ? token : undefined;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly blacklistService: BlacklistService,
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<IAuthenticatedRequest>();
    const token = extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException(SYS_MESSAGES.UNAUTHORIZED);
    }

    try {
      const payload = await this.jwtService.verifyAsync<AuthJwtPayload>(token);

      await this.blacklistService.revokeAccess(token, payload);
      request.user = payload;
    } catch {
      throw new UnauthorizedException(SYS_MESSAGES.INVALID_ACCESS_TOKEN);
    }

    return true;
  }
}
