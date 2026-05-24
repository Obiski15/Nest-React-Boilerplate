import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, Length } from 'class-validator';

import {
  ClientType,
  RecoveryCodeRequest,
  TwoFactorAuthenticationRequest,
  TwoFactorVerificationRequest,
} from '@app/types';

export class TwoFactorCodeDto implements TwoFactorVerificationRequest {
  @ApiProperty({
    description: 'The 6-digit TOTP code from the authenticator app',
  })
  @IsString()
  @Length(6, 6)
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    description: 'The client type logging in',
    example: ClientType.WEB,
    required: false,
  })
  @IsEnum(ClientType)
  client_id: ClientType;
}

export class LoginWith2faDto
  extends TwoFactorCodeDto
  implements TwoFactorAuthenticationRequest
{
  @ApiProperty({
    description: 'The temporary token returned from the initial login step',
    required: false,
  })
  @IsString()
  temp_token: string;
}

export class LoginWithRecoveryCodeDto implements RecoveryCodeRequest {
  @ApiProperty({
    description: 'The temporary token returned from the initial login step',
  })
  @IsString()
  @IsNotEmpty()
  temp_token: string;

  @ApiProperty({
    description: 'A 10-character backup recovery code',
  })
  @IsString()
  @IsNotEmpty()
  recovery_code: string;

  @ApiProperty({
    description: 'The client type logging in',
    example: ClientType.WEB,
  })
  @IsEnum(ClientType)
  @IsNotEmpty()
  client_id: ClientType;
}
