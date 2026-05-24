import { Global, Module } from '@nestjs/common';

import { TemplateModule } from '../templates/template.module';
import { MailProcessor } from './services/mail.processor';
import { MailService } from './services/mail.service';

@Global()
@Module({
  imports: [TemplateModule],
  providers: [MailService, MailProcessor],
  exports: [MailService, MailProcessor],
})
export class MailModule {}
