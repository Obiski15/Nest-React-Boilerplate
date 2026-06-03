import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

import { AuthResponse } from '@app/types';
import { config } from '@/config';

import { DeviceService } from './services/device.service';
import { TokenService } from './services/token.service';

interface CustomConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const isServer = typeof window === 'undefined';
const BASE_PATH = '/api/v1';

const apiClient = axios.create({
  baseURL: isServer ? config.API_BASE_URL + `${BASE_PATH}` : `${BASE_PATH}`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

const refreshClient = axios.create({
  baseURL: isServer ? config.API_BASE_URL + BASE_PATH : BASE_PATH,
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: Error) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.request.use(
  (config) => {
    const accessToken = TokenService.getAccessToken();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    if (error instanceof Error) {
      return Promise.reject(error);
    }
  },
);

apiClient.interceptors.response.use(
  (response) => response,

  async (e) => {
    const err = e as AxiosError;
    const originalRequest = err.config as CustomConfig;

    if (
      !(err instanceof AxiosError) ||
      err.response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url?.includes('/auth/refresh')
    ) {
      return Promise.reject(err);
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        })
        .catch((error) => {
          if (error instanceof Error) {
            return Promise.reject(error);
          }
        });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const response = await refreshClient.post<{ data: AuthResponse }>(
        '/auth/refresh',
        {
          client_id: 'web_app',
          device_id: DeviceService.getDeviceId(),
        },
        { withCredentials: true },
      );

      const { access_token } = response.data.data.tokens;

      TokenService.setAccessToken(access_token);
      processQueue(null, access_token);

      originalRequest.headers.Authorization = `Bearer ${access_token}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError as Error);
      TokenService.clearAccessToken();

      if (!isServer) {
        window.dispatchEvent(new Event('auth:logout'));
      }

      if (refreshError instanceof Error) {
        return Promise.reject(err);
      }
    } finally {
      isRefreshing = false;
    }
  },
);

export { apiClient };
