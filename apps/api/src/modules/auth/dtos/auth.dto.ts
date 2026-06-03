import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

import {
  ClientType,
  DeviceMetadata,
  EmailRequest,
  LoginRequest,
  LogoutRequest,
  RefreshRequest,
  RegisterRequest,
  ResetPasswordRequest,
  VerifyEmailRequest,
} from '@app/types';

import { CreateUserDto } from '../../user/dtos/user.dto';

export class RegisterDto extends CreateUserDto implements RegisterRequest {
  @ApiProperty({
    description: 'The client type registering the account',
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
    example: { userAgent: 'Mozilla/5.0...', timeZone: 'Africa/Lagos' },
  })
  @IsObject()
  @IsOptional()
  metadata?: DeviceMetadata;
}

export class LoginDto implements LoginRequest {
  @ApiProperty({
    description: 'Email address of the user',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Password must be at least 8 characters long',
    example: 'Str0ngP@ssw0rd!',
  })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @IsString()
  @IsNotEmpty()
  password: string;

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
  metadata?: DeviceMetadata;
}

export class RefreshTokenDto implements RefreshRequest {
  @ApiProperty({
    description: 'The client type to refresh the token for',
    example: ClientType.WEB,
  })
  @IsEnum(ClientType)
  @IsNotEmpty()
  client_id: ClientType;

  @ApiProperty({
    description: 'Unique cryptographic identifier for the physical device',
  })
  @IsString()
  @IsNotEmpty()
  device_id: string;

  @ApiProperty({ description: 'The valid refresh token' })
  @IsString()
  @IsOptional()
  refresh_token?: string;
}

export class LogoutDto implements LogoutRequest {
  @ApiProperty({
    description: 'The client type to log out from',
    example: ClientType.WEB,
  })
  @IsEnum(ClientType)
  @IsNotEmpty()
  client_id: ClientType;

  @ApiProperty({
    description: 'Unique cryptographic identifier for the physical device',
  })
  @IsString()
  @IsNotEmpty()
  device_id: string;

  @ApiProperty({ description: 'The refresh token you wish to revoke' })
  @IsString()
  @IsOptional()
  refresh_token?: string;
}

export class ResendVerificationEmailDto implements EmailRequest {
  @ApiProperty({
    description: 'Email address associated with the account',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class ForgotPasswordDto implements EmailRequest {
  @ApiProperty({
    description: 'Email address associated with the account',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class VerifyEmailDto implements VerifyEmailRequest {
  @ApiProperty({ description: 'The 64-character hex token sent to the email' })
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class ResetPasswordDto implements ResetPasswordRequest {
  @ApiProperty({ description: 'The 64-character hex token sent to the email' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    description: 'The new password',
    example: 'Str0ngP@ssw0rd!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @IsNotEmpty()
  new_password: string;
}
