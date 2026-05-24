import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

import { AppLogger } from '../../../common/logger/logger.service';
import { LOG_EVENTS } from '../../../constants/log_events';
import { LOG_MESSAGES } from '../../../constants/log_messages';
import { MAIL_QUEUE_NAME, MailJobName } from '../enums/mail-job.enum';
import { IAuthTokenContext, IMailJob } from '../interfaces/mail-job.interface';
import { MailService } from './mail.service';

@Processor(MAIL_QUEUE_NAME)
export class MailProcessor extends WorkerHost {
  constructor(
    private readonly mailService: MailService,
    private readonly logger: AppLogger,
  ) {
    super();
    this.logger.setContext(MailProcessor.name);
  }

  async process(job: Job<IMailJob, unknown, MailJobName>): Promise<any> {
    const { user, context } = job.data;

    switch (job.name) {
      case MailJobName.SEND_VERIFICATION: {
        const { rawToken } = context as unknown as IAuthTokenContext;
        await this.mailService.sendVerificationEmail(user, rawToken);
        break;
      }

      case MailJobName.SEND_WELCOME:
        await this.mailService.sendWelcomeEmail(user);
        break;

      case MailJobName.SEND_PASSWORD_RESET: {
        const { rawToken } = context as unknown as IAuthTokenContext;
        await this.mailService.sendPasswordResetEmail(user, rawToken);
        break;
      }

      default:
        this.logger.error(
          LOG_MESSAGES.BACKGROUND_JOBS.UNKNOWN_JOB_NAME(job.name),
          { event: LOG_EVENTS.UNKNOWN_JOB_NAME },
          new Error('InvalidJobName').stack,
        );
    }
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(
      LOG_MESSAGES.BACKGROUND_JOBS.BACKGROUND_JOB_FAILED(
        job.name,
        job.id as string,
        job.attemptsMade,
        job.opts.attempts || 0,
      ),
      { event: LOG_EVENTS.BACKGROUND_JOB_FAILED },
      error.stack,
    );
  }
}
