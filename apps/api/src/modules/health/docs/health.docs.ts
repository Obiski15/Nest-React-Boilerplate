import { applyDecorators } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';

export const ApiHealthCheck = () =>
  applyDecorators(
    ApiOperation({
      summary: 'System Health Check',
      description:
        'Used by load balancers and container orchestrators to verify API and Database uptime.',
    }),
  );
