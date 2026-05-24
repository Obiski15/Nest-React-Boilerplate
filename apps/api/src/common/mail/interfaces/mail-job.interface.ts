export interface IMailJob<T = Record<string, unknown>> {
  user: {
    name: string;
    email: string;
  };
  context: T;
  replyTo?: string;
}

export interface IAuthTokenContext {
  rawToken: string;
}
