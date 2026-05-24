import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { SendMailOptions, Transporter } from 'nodemailer';

import { AppLogger } from '../../../common/logger/logger.service';
import { LOG_EVENTS } from '../../../constants/log_events';
import { LOG_MESSAGES } from '../../../constants/log_messages';
import { TEMPLATE_NAMES } from '../../templates/enums/templates.enum';
import { ITemplateContext } from '../../templates/interfaces/template.interface';
import { TemplateService } from '../../templates/services/template.service';

@Injectable()
export class MailService {
  private transporter: Transporter | null = null;
  private readonly frontend_url: string;

  constructor(
    private readonly templateService: TemplateService,
    private readonly configService: ConfigService,
    private readonly logger: AppLogger,
  ) {
    this.frontend_url =
      this.configService.getOrThrow<string>('APP.FRONTEND_URL');
    this.logger.setContext(MailService.name);
  }

  async sendVerificationEmail(
    user: ITemplateContext['user'],
    rawToken: string,
  ) {
    const verification_link = `${this.frontend_url}/verify-email?token=${rawToken}&email=${user.email}`;
    const subject = 'Email Verification';

    const html = this.templateService.render(
      TEMPLATE_NAMES.VERIFICATION_EMAIL,
      {
        user,
        action_url: verification_link,
      },
    );

    // send mail
    await this.send_mail({
      to: user.email,
      subject,
      html,
    });

    this.logger.log(
      LOG_MESSAGES.MAIL.VERIFICATION_EMAIL_SENT(user.email, verification_link),
      {
        event: LOG_EVENTS.VERIFICATION_EMAIL_SENT,
        user_name: user.name,
      },
    );
  }

  async sendWelcomeEmail(user: ITemplateContext['user']) {
    const subject = 'Welcome to Our Service';

    const html = this.templateService.render(TEMPLATE_NAMES.WELCOME_EMAIL, {
      user,
      action_url: this.frontend_url,
    });

    // send mail
    await this.send_mail({
      to: user.email,
      subject,
      html,
    });

    this.logger.log(LOG_MESSAGES.MAIL.WELCOME_EMAIL_SENT(user.email), {
      event: LOG_EVENTS.WELCOME_EMAIL_SENT,
      user_name: user.name,
    });
  }

  async sendPasswordResetEmail(
    user: ITemplateContext['user'],
    rawToken: string,
  ) {
    const resetLink = `${this.frontend_url}/reset-password?token=${rawToken}&email=${user.email}`;
    const subject = 'Password Reset Request';

    const html = this.templateService.render(
      TEMPLATE_NAMES.PASSWORD_RESET_EMAIL,
      {
        action_url: resetLink,
        user,
      },
    );

    // send mail
    await this.send_mail({
      to: user.email,
      subject,
      html,
    });

    this.logger.log(
      LOG_MESSAGES.MAIL.PASSWORD_RESET_EMAIL_SENT(user.email, resetLink),
      {
        event: LOG_EVENTS.PASSWORD_RESET_EMAIL_SENT,
        user_name: user.name,
      },
    );
  }

  private async send_mail(options: SendMailOptions) {
    try {
      const {
        from = this.configService.getOrThrow<string>('MAIL.ACCOUNT'),
        to,
        html,
        subject,
        ...rest
      } = options;

      await this.getTransporter().sendMail({
        from,
        to,
        subject,
        html,
        ...rest,
      });
    } catch (error) {
      this.logger.error(LOG_MESSAGES.MAIL.FAILED, {
        event: LOG_EVENTS.EMAIL_SEND_FAILURE,
        ...options,
      });
      throw error;
    }
  }

  private createTransporter(): Transporter {
    const isDev =
      this.configService.getOrThrow<string>('NODE_ENV') === 'development';

    if (isDev) {
      return nodemailer.createTransport({
        host: 'sandbox.smtp.mailtrap.io',
        port: 2525,
        auth: {
          user: this.configService.getOrThrow<string>('MAIL.MAILTRAP.USER'),
          pass: this.configService.getOrThrow<string>('MAIL.MAILTRAP.PASS'),
        },
      });
    }
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.getOrThrow<string>('MAIL.GMAIL.USER'),
        pass: this.configService.getOrThrow<string>('MAIL.GMAIL.PASS'),
      },
    });
  }

  private getTransporter(): Transporter {
    if (!this.transporter) {
      this.transporter = this.createTransporter();
    }
    return this.transporter;
  }
}
