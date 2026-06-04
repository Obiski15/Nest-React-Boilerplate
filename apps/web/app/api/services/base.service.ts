import { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';

import { ErrorResponse, SuccessResponse } from '@app/types';

import { apiClient } from '../axiosInstance';

export default abstract class BaseService {
  protected clientUrl: string;

  constructor(url: string) {
    this.clientUrl = url;
  }

  private buildUrl(endpoint: string) {
    return `${this.clientUrl}${endpoint}`;
  }

  protected async handleRequest<IResponse>(
    request: Promise<AxiosResponse<SuccessResponse<IResponse>>>,
  ) {
    try {
      return (await request).data;
    } catch (error) {
      throw new Error(this.handleError(error));
    }
  }

  handleError(error: unknown) {
    let message = 'An unexpected error occurred. Please try again later.';
    if (error instanceof AxiosError) {
      const errorData = (error.response?.data as ErrorResponse).error.message;
      if (typeof errorData === 'string') {
        message = errorData;
      } else if (Array.isArray(errorData)) {
        message = errorData.join(', ');
      }
    }
    return message;
  }

  protected get<IResponse>(url: string, config?: AxiosRequestConfig) {
    return this.handleRequest<IResponse>(
      apiClient.get(this.buildUrl(url), config),
    );
  }

  protected post<IRequest, IResponse>(
    url: string,
    data?: IRequest,
    config?: AxiosRequestConfig,
  ) {
    return this.handleRequest<IResponse>(
      apiClient.post(this.buildUrl(url), data, config),
    );
  }

  protected patch<IRequest, IResponse>(
    url: string,
    data?: IRequest,
    config?: AxiosRequestConfig,
  ) {
    return this.handleRequest<IResponse>(
      apiClient.patch(this.buildUrl(url), data, config),
    );
  }
  protected put<IRequest, IResponse>(
    url: string,
    data?: IRequest,
    config?: AxiosRequestConfig,
  ) {
    return this.handleRequest<IResponse>(
      apiClient.put(this.buildUrl(url), data, config),
    );
  }

  protected delete<IResponse>(url: string, config?: AxiosRequestConfig) {
    return this.handleRequest<IResponse>(
      apiClient.delete(this.buildUrl(url), config),
    );
  }
}
