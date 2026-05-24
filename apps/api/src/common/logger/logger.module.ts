import { DynamicModule, Global, Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';

import { AppLogger } from './logger.service';
import { winstonConfig } from './winston.config';

type WinstonModuleStatic = {
  forRoot: (options: unknown) => DynamicModule;
};

const typedWinstonModule = WinstonModule as unknown as WinstonModuleStatic;

@Global()
@Module({
  imports: [typedWinstonModule.forRoot(winstonConfig)],
  providers: [AppLogger],
  exports: [AppLogger],
})
export class LoggerModule {}
