import { Global, Module } from '@nestjs/common';

import { BlacklistService } from './services/blacklist.service';

@Global()
@Module({
  providers: [BlacklistService],
  exports: [BlacklistService],
})
export class BlacklistModule {}
