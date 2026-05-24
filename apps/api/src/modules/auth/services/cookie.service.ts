import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CookieOptions, Request, Response } from 'express';

@Injectable()
export class CookieService {
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly COOKIE_OPTIONS: CookieOptions = {
    httpOnly: true,
  };

  constructor(private readonly configService: ConfigService) {
    const isProd =
      this.configService.getOrThrow<string>('NODE_ENV') === 'production';

    this.COOKIE_OPTIONS.sameSite = isProd ? 'strict' : 'lax';
    this.COOKIE_OPTIONS.secure = isProd;
    this.COOKIE_OPTIONS.maxAge = this.configService.getOrThrow<number>(
      'COOKIE.REFRESH_TOKEN_EXPIRES_IN',
    );
  }

  setRefreshToken(res: Response, token: string): void {
    res.cookie(this.REFRESH_TOKEN_KEY, token, this.COOKIE_OPTIONS);
  }

  getRefreshToken(req: Request) {
    return (req.cookies?.[this.REFRESH_TOKEN_KEY] as string) || undefined;
  }

  clearRefreshToken(res: Response): void {
    res.clearCookie(this.REFRESH_TOKEN_KEY, this.COOKIE_OPTIONS);
  }
}
