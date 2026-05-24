let access_token: string | null = null;

export const TokenService = {
  getAccessToken: (): string | null => {
    return access_token;
  },

  setAccessToken: (token: string) => {
    access_token = token;
  },

  clearAccessToken: () => {
    access_token = null;
  },
};
