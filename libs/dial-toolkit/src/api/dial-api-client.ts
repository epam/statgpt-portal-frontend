/**
 * DIAL API Client - HTTP client for AI DIAL backend services
 *
 * Provides a comprehensive HTTP client for communicating with AI DIAL APIs,
 * featuring request/response logging, authentication handling (API key and JWT),
 * streaming support, error handling, and header sanitization for security.
 */

import {
  ApiHeaders,
  getHeaders,
  LogData,
  RequestOptions,
  sanitizeHeaders,
} from '@epam/statgpt-shared-toolkit';
import { sendRequest } from '../utils/send-request';
import { DialApiConfig } from '../models/dial-config';
import { getErrorMessage } from '../utils/get-error-message';

export class DialApiClient {
  public readonly config: DialApiConfig;

  constructor(config: DialApiConfig) {
    this.config = config;

    console.info('DialApiClient initialized', {
      host: config.host || 'NOT SET',
      hasApiKey: !!config.apiKey,
      version: config.version,
    });
  }

  async getRequest<T>(
    endpoint: string,
    token: string,
    options?: RequestOptions,
  ): Promise<T> {
    return this.request(endpoint, token, { ...options, method: 'GET' });
  }

  async postRequest<T>(
    endpoint: string,
    token: string,
    options?: RequestOptions,
  ): Promise<T> {
    return this.request(endpoint, token, { ...options, method: 'POST' });
  }

  async requestBlob(
    endpoint: string,
    token: string,
    options: RequestOptions,
  ): Promise<Blob> {
    const url = `${this.config.host}${endpoint}`;
    const reqHeaders = {
      ...getHeaders(this.config.apiKey, {
        jwt: token,
        chatReference: options.chatReference,
      }),
      ...options.headers,
    };

    try {
      const response = await sendRequest(url, reqHeaders, options);

      return response.blob();
    } catch (error) {
      console.error('API Request Exception', {
        method: options.method,
        url,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async request<T>(
    endpoint: string,
    token: string,
    options: RequestOptions,
  ): Promise<T> {
    const startTime = Date.now();

    const url = `${this.config.host}${endpoint}`;
    const reqHeaders = {
      ...getHeaders(this.config.apiKey, {
        jwt: token,
        chatReference: options.chatReference,
      }),
      ...options.headers,
    };

    this.addInfoRequestLog('API Request', url, options, reqHeaders);

    try {
      const response = await sendRequest(url, reqHeaders, options);

      const duration = Date.now() - startTime;

      let responseData: { data: unknown; error?: string; message?: string };
      const responseText = await response.text();

      try {
        responseData = responseText ? JSON.parse(responseText) : {};
      } catch {
        this.addErrorRequestParsing(
          url,
          options,
          response,
          duration,
          responseText,
        );

        if (!response.ok) {
          throw new Error(
            `API request failed: ${response.status} ${response.statusText} - ${responseText.substring(0, 100)}`,
          );
        }

        // If successful but not JSON, return the text
        responseData = { data: responseText };
      }

      if (!response.ok) {
        this.addErrorRequestLog(url, options, response, duration, responseData);

        const errorMessage = getErrorMessage(responseData, response);

        throw new Error(`API request failed: ${errorMessage}`);
      }

      return responseData as T;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error('API Request Exception', {
        method: options.method,
        url,
        duration: `${duration}ms`,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async stream(
    endpoint: string,
    token: string,
    options: RequestOptions,
  ): Promise<ReadableStream> {
    const url = `${this.config.host}${endpoint}`;
    const reqHeaders = getHeaders(
      this.config.apiKey,
      {
        jwt: token,
        chatReference: options.chatReference,
      },
      options.headers,
    );

    this.addInfoRequestLog('Stream Request', url, options, reqHeaders);
    const response = await sendRequest(url, reqHeaders, options);

    if (!response.ok) {
      console.error('Stream Request Failed', {
        method: options.method || 'POST',
        url,
        status: response.status,
        statusText: response.statusText,
      });

      throw new Error(
        `Stream request failed: ${response.status} ${response.statusText}`,
      );
    }

    if (!response.body) {
      throw new Error('No response body for stream');
    }

    return response.body;
  }

  private addInfoRequestLog(
    key: string,
    url: string,
    options: RequestOptions,
    headers: ApiHeaders,
  ) {
    const logData: LogData = {
      method: options.method || 'GET',
      url,
      headers: sanitizeHeaders(headers),
    };

    if (options.body) {
      logData.body = options.body;
    }

    console.info(key, logData);
  }

  private addErrorRequestLog(
    url: string,
    options: RequestOptions,
    response: Response,
    duration: number,
    responseData: unknown,
  ) {
    console.error('API Request Failed', {
      method: options.method,
      url,
      status: response.status,
      statusText: response.statusText,
      duration: `${duration}ms`,
      response: responseData,
    });
  }

  private addErrorRequestParsing(
    url: string,
    options: RequestOptions,
    response: Response,
    duration: number,
    responseText: string,
  ) {
    console.error('API Response Parse Error', {
      method: options.method,
      url,
      status: response.status,
      statusText: response.statusText,
      duration: `${duration}ms`,
      responseText: responseText.substring(0, 200), // First 200 chars
      error: 'Response is not valid JSON',
    });
  }
}
