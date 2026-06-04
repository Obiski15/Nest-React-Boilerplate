import { Body, Controller, Get, Put, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { ResponseMessage } from '../../../common/decorators/response_message.decorator';
import type { IAuthenticatedRequest } from '../../../common/interfaces/auth.interface';
import {
  ApiGetNotificationPreferences,
  ApiUpdateNotificationPreference,
} from '../docs/notification_preference.docs';
import { UpdatePreferenceDto } from '../dtos/notification_preference.dto';
import { NotificationPreferenceService } from '../services/notification_preference.service';

@ApiTags('Notification Preferences')
@Controller('notifications/preferences')
export class NotificationPreferenceController {
  constructor(
    private readonly preferenceService: NotificationPreferenceService,
  ) {}

  @Get()
  @ApiGetNotificationPreferences()
  @ResponseMessage('Preferences retrieved successfully')
  async getPreferences(@Req() req: IAuthenticatedRequest) {
    return await this.preferenceService.getUserPreferences(req.user.sub);
  }

  @Put()
  @ApiUpdateNotificationPreference()
  @ResponseMessage('Preference updated successfully')
  async updatePreference(
    @Req() req: IAuthenticatedRequest,
    @Body() body: UpdatePreferenceDto,
  ) {
    await this.preferenceService.upsertPreference(req.user.sub, body);
  }
}
