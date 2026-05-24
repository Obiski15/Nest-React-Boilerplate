export interface IAppContext {
  name: string;
  logo_url: string;
  address: string;
  year: number;
}

export interface ITemplateTheme {
  primary: string;
  background: string;
  surface: string;
  text: string;
  text_heading: string;
  text_muted: string;
  button_text: string;
  footer_bg: string;
}

export interface ITemplateContext {
  user: {
    name: string;
    email: string;
  };
  action_url: string;
  [key: string]: unknown;
}
