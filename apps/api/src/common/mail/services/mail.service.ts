import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { SendMailOptions, Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: Transporter | null = null;

  constructor(private readonly configService: ConfigService) {}

  async send_mail(options: SendMailOptions) {
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
