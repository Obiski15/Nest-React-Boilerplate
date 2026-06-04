import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

export const ApiGetNotificationPreferences = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Get all user notification preferences' }),
  );

export const ApiUpdateNotificationPreference = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Update a specific notification preference' }),
  );
