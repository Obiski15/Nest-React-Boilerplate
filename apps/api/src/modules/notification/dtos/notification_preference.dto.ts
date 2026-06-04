import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';

import {
  SubscribableNotificationEventType,
  UpdateNotificationPreferenceRequest,
} from '@app/types';

export class UpdatePreferenceDto implements UpdateNotificationPreferenceRequest {
  @ApiProperty({ enum: SubscribableNotificationEventType })
  @IsEnum(SubscribableNotificationEventType)
  event_type: SubscribableNotificationEventType;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  email?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  whatsapp?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  sms?: boolean;
}
