import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';

import { ClientType } from '@app/types';

import { Public } from '../../../common/decorators/public.decorator';
import { ResponseMessage } from '../../../common/decorators/response_message.decorator';
import type { IAuthenticatedRequest } from '../../../common/interfaces/auth.interface';
import { THROTTLE_OPTIONS } from '../../../constants';
import * as SYS_MESSAGES from '../../../constants/system_messages';
import { UserService } from '../../user/services/user.service';
import {
  ApiAuthenticate2fa,
  ApiDisable2fa,
  ApiForgotPassword,
  ApiGenerate2fa,
  ApiGetSessions,
  ApiLogin,
  ApiLogout,
  ApiRecover2fa,
  ApiRefreshToken,
  ApiRegister,
  ApiResendVerification,
  ApiResetPassword,
  ApiRevokeAllSessions,
  ApiTurnOn2fa,
  ApiVerifyEmail,
} from '../docs/auth.docs';
import { SessionFiltersDto } from '../dtos/auth_sessions.dto';
import {
  ForgotPasswordDto,
  LoginDto,
  LogoutDto,
  RefreshTokenDto,
  RegisterDto,
  ResendVerificationEmailDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from '../dtos/auth.dto';
import {
  LoginWith2faDto,
  LoginWithRecoveryCodeDto,
  TwoFactorCodeDto,
} from '../dtos/two_factor.dto';
import { AuthSessionsService } from '../services/auth_sessions.service';
import { AuthService } from '../services/auth.service';
import { CookieService } from '../services/cookie.service';
import { TwoFactorService } from '../services/two_factor.service';

@ApiTags('Auth')
@Throttle({ default: THROTTLE_OPTIONS.auth })
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authSessionsService: AuthSessionsService,
    private readonly twoFactorService: TwoFactorService,
    private readonly cookieService: CookieService,
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Public()
  @ApiRegister()
  @ResponseMessage(SYS_MESSAGES.USER_REGISTERED)
  @Post('register')
  async register(
    @Body() body: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const data = await this.authService.register(body);
    if (body.client_id === ClientType.WEB && 'tokens' in data) {
      this.cookieService.setRefreshToken(res, data.tokens.refresh_token);

      delete (data.tokens as { refresh_token?: string }).refresh_token;
    }
    return data;
  }

  @Public()
  @ApiLogin()
  @Post('login')
  @ResponseMessage(SYS_MESSAGES.LOGIN_SUCCESS)
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const data = await this.authService.login(body);

    if (body.client_id === ClientType.WEB && 'tokens' in data) {
      this.cookieService.setRefreshToken(res, data.tokens.refresh_token);

      delete (data.tokens as { refresh_token?: string }).refresh_token;
    }

    return data;
  }

  @ApiLogout()
  @Post('logout')
  @ResponseMessage(SYS_MESSAGES.LOGOUT_SUCCESS)
  async logout(
    @Res({ passthrough: true }) res: Response,
    @Req() req: IAuthenticatedRequest,
    @Body() body: LogoutDto,
  ) {
    const access_token = req.headers.authorization?.split(' ')[1] as string;
    let refresh_token: string | undefined;
    const user_id = req.user.sub;

    if (body.client_id === ClientType.WEB) {
      refresh_token = req.cookies['refresh_token'] as string;
    } else {
      refresh_token = body.refresh_token;
    }

    await this.authService.logout(user_id, access_token, refresh_token);
    if (body.client_id === ClientType.WEB) {
      this.cookieService.clearRefreshToken(res);
    }
  }

  @Public()
  @ApiRefreshToken()
  @Post('refresh')
  @ResponseMessage(SYS_MESSAGES.TOKEN_REFRESHED)
  async refresh(
    @Res({ passthrough: true }) res: Response,
    @Req() req: IAuthenticatedRequest,
    @Body() body: RefreshTokenDto,
  ) {
    try {
      let refresh_token: string | undefined;

      if (body.client_id === ClientType.WEB) {
        refresh_token = this.cookieService.getRefreshToken(req);
      } else {
        refresh_token = body.refresh_token;
      }

      const data = await this.authService.refreshToken(refresh_token);

      if (body.client_id === ClientType.WEB && 'tokens' in data) {
        this.cookieService.setRefreshToken(res, data.tokens.refresh_token);

        delete (data.tokens as { refresh_token?: string }).refresh_token;
      }

      return data;
    } catch (error) {
      if (
        body.client_id === ClientType.WEB &&
        error instanceof UnauthorizedException
      ) {
        this.cookieService.clearRefreshToken(res);
      }
      throw error;
    }
  }

  @Public()
  @ApiResendVerification()
  @Post('verify-email/resend')
  @ResponseMessage(SYS_MESSAGES.VERIFICATION_EMAIL_SENT)
  async resendVerification(@Body() body: ResendVerificationEmailDto) {
    await this.authService.resendVerificationEmail(body.email);
  }

  @Public()
  @ApiVerifyEmail()
  @Post('verify-email')
  @ResponseMessage(SYS_MESSAGES.EMAIL_VERIFIED)
  async verifyEmail(@Body() body: VerifyEmailDto) {
    await this.authService.verifyEmail(body.token);
  }

  @Public()
  @ApiForgotPassword()
  @Post('forgot-password')
  @ResponseMessage(SYS_MESSAGES.PASSWORD_RESET_EMAIL_SENT)
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    await this.authService.forgotPassword(body.email);
  }

  @Public()
  @ApiResetPassword()
  @Post('reset-password')
  @ResponseMessage(SYS_MESSAGES.PASSWORD_RESET_SUCCESS)
  async resetPassword(@Body() body: ResetPasswordDto) {
    await this.authService.resetPassword(body);
  }

  // SESSION MANAGEMENT ROUTES
  @ApiGetSessions()
  @Get('sessions')
  @ResponseMessage(SYS_MESSAGES.SESSIONS_RETRIEVED)
  async getMySessions(
    @Req() req: IAuthenticatedRequest,
    @Query() filters: SessionFiltersDto,
  ) {
    return await this.authSessionsService.findAllPaginated(
      req.user.sub,
      filters,
    );
  }

  @ApiRevokeAllSessions()
  @Delete('sessions')
  @ResponseMessage(SYS_MESSAGES.SESSIONS_REVOKED)
  async revokeAllSessions(@Req() req: IAuthenticatedRequest) {
    await this.authSessionsService.deleteAll(req.user.sub);
  }

  // 2FA ROUTES
  @Public()
  @ApiAuthenticate2fa()
  @Post('2fa/authenticate')
  @ResponseMessage(SYS_MESSAGES.LOGIN_SUCCESS)
  async authenticate2fa(
    @Body() body: LoginWith2faDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const data = await this.authService.verify2faLogin(
      body.temp_token,
      body.code,
    );

    if (body.client_id === ClientType.WEB && 'tokens' in data) {
      this.cookieService.setRefreshToken(res, data.tokens.refresh_token);

      delete (data.tokens as { refresh_token?: string }).refresh_token;
    }

    return data;
  }

  @ApiGenerate2fa()
  @Get('2fa/generate')
  @ResponseMessage(SYS_MESSAGES.TWO_FACTOR_SECRET_GENERATED)
  async generateTwoFactorSecret(@Req() req: IAuthenticatedRequest) {
    const user = await this.userService.getById({ id: req.user.sub });

    const { otpAuthUrl, secret } =
      await this.twoFactorService.generateTwoFactorSecret(user);

    return {
      qr_code_url:
        await this.twoFactorService.generateQrCodeDataURL(otpAuthUrl),

      manual_entry: {
        secret_key: secret,
      },
    };
  }

  @ApiTurnOn2fa()
  @Post('2fa/turn-on')
  @ResponseMessage(SYS_MESSAGES.TWO_FACTOR_ENABLED)
  async turnOnTwoFactorAuthentication(
    @Req() req: IAuthenticatedRequest,
    @Body() body: TwoFactorCodeDto,
  ) {
    const user = await this.userService.getById({ id: req.user.sub });

    const backup_codes =
      await this.twoFactorService.turnOnTwoFactorAuthentication(
        user,
        body.code,
      );

    return { backup_codes };
  }

  @ApiDisable2fa()
  @Post('2fa/disable')
  @ResponseMessage(SYS_MESSAGES.TWO_FACTOR_DISABLED)
  async disableTwoFactorAuthentication(
    @Req() req: IAuthenticatedRequest,
    @Body() body: TwoFactorCodeDto,
  ) {
    await this.twoFactorService.disableTwoFactorAuthentication(
      req.user.sub,
      body.code,
    );
  }

  @Public()
  @ApiRecover2fa()
  @Post('2fa/recover')
  @ResponseMessage(SYS_MESSAGES.LOGIN_SUCCESS)
  async authenticateWithRecoveryCode(
    @Body() body: LoginWithRecoveryCodeDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const data = await this.authService.verify2faRecovery(
      body.temp_token,
      body.recovery_code,
    );

    if (body.client_id === ClientType.WEB && 'tokens' in data) {
      this.cookieService.setRefreshToken(res, data.tokens.refresh_token);

      delete (data.tokens as { refresh_token?: string }).refresh_token;
    }

    return data;
  }
}
