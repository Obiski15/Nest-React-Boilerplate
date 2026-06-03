import { Controller, Get, Version, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  MemoryHealthIndicator,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';

import { Public } from '../../../common/decorators/public.decorator';
import { ApiHealthCheck } from '../docs/health.docs';

@ApiTags('System')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
  ) {}

  @Public()
  @ApiHealthCheck()
  @Get()
  @HealthCheck()
  @Version(VERSION_NEUTRAL)
  check() {
    return this.health.check([
      // Check if the database responds to a ping in under 1000ms
      () => this.db.pingCheck('database', { timeout: 1000 }),

      // Check if the V8 memory heap exceeds 250MB (Adjust based on server size)
      () => this.memory.checkHeap('memory_heap', 250 * 1024 * 1024),

      // Check if the allocated resident set size (RSS) exceeds 300MB
      () => this.memory.checkRSS('memory_rss', 300 * 1024 * 1024),
    ]);
  }
}
