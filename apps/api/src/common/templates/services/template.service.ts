import * as path from 'path';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nunjucks from 'nunjucks';

import {
  IAppContext,
  ITemplateContext,
  ITemplateTheme,
} from '../interfaces/template.interface';

@Injectable()
export class TemplateService {
  private njkEnv: nunjucks.Environment;

  private readonly theme: ITemplateTheme = {
    primary: '#4F46E5', // The brand color
    background: '#F3F4F6', // The outer background
    surface: '#FFFFFF', // The email card
    text: '#374151', // Main body text
    text_heading: '#111827', // H1 text
    text_muted: '#9CA3AF', // Footer text
    button_text: '#FFFFFF', // Text inside the CTA button
    footer_bg: '#F9FAFB', // Subtle footer background
  };

  private readonly appContext: IAppContext | null = null;

  constructor(private readonly configService: ConfigService) {
    this.appContext = {
      logo_url: this.configService.getOrThrow<string>('APP.LOGO_URL'),
      address: this.configService.getOrThrow<string>('APP.ADDRESS'),
      name: this.configService.getOrThrow<string>('APP.NAME'),
      year: new Date().getFullYear(),
    };
    this.njkEnv = nunjucks.configure(path.resolve(__dirname, '../'), {
      autoescape: true,
    });
  }

  render(name: string, context: ITemplateContext) {
    return this.njkEnv.render(name, {
      theme: this.theme,
      app: this.appContext,
      ...context,
    });
  }
}
