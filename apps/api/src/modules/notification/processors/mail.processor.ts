import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

import { AppLogger } from '../../../common/logger/logger.service';
import { MailService } from '../../../common/mail/services/mail.service';
import { LOG_EVENTS } from '../../../constants/log_events';
import { LOG_MESSAGES } from '../../../constants/log_messages';
import { EMAIL_QUEUE, NotificationEventType } from '../enums/notification.enum';
import { EmailQueuePayload } from '../interfaces/notification.interface';

@Processor(EMAIL_QUEUE)
export class MailProcessor extends WorkerHost {
  constructor(
    private readonly mailService: MailService,
    private readonly logger: AppLogger,
  ) {
    super();
    this.logger.setContext(MailProcessor.name);
  }

  async process(job: Job<EmailQueuePayload, unknown, NotificationEventType>) {
    this.logger.log(LOG_MESSAGES.MAIL.PROCESSING(job.data.to), {
      event: LOG_EVENTS.BACKGROUND_JOB_STARTED,
      jobId: job.id,
      jobName: job.name,
    });

    const { to, subject, message } = job.data;

    await this.mailService.send_mail({ to, subject, html: message });

    this.logger.log(LOG_MESSAGES.MAIL.SENT(to), {
      event: LOG_EVENTS.BACKGROUND_JOB_COMPLETED,
      jobId: job.id,
      jobName: job.name,
    });
  }

  @OnWorkerEvent('failed')
  onFailed(
    job: Job<EmailQueuePayload, unknown, NotificationEventType> | undefined,
    error: Error,
  ) {
    if (!job) return;
    this.logger.error(
      LOG_MESSAGES.MAIL.FAILED(job.data.to),
      {
        event: LOG_EVENTS.BACKGROUND_JOB_FAILED,
        jobName: job.name,
        jobId: job.id,
        attemptsMade: job.attemptsMade,
        maxAttempts: job.opts.attempts || 0,
      },
      error.stack,
    );
  }
}
