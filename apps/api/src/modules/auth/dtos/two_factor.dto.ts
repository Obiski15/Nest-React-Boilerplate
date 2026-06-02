import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

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
    description: 'The client type',
    example: ClientType.WEB,
    required: false,
  })
  @IsEnum(ClientType)
  @IsOptional()
  client_id: ClientType;
}

export class LoginWith2faDto
  extends TwoFactorCodeDto
  implements TwoFactorAuthenticationRequest
{
  @ApiProperty({
    description: 'The temporary token returned from the initial login step',
  })
  @IsString()
  @IsNotEmpty()
  temp_token: string;

  @ApiProperty({
    description: 'Unique cryptographic identifier for the physical device',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @IsNotEmpty()
  device_id: string;

  @ApiPropertyOptional({
    description: 'Hardware and browser metadata for active session tracking',
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
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

  @ApiProperty({
    description: 'Unique cryptographic identifier for the physical device',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @IsNotEmpty()
  device_id: string;

  @ApiPropertyOptional({
    description: 'Hardware and browser metadata for active session tracking',
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
