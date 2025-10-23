import { getErrorMessage } from '@epam/statgpt-dial-toolkit';
import {
  ApiHeaders,
  getHeaders,
  LogData,
  RequestOptions,
  sanitizeHeaders,
  sendRequest,
} from '@epam/statgpt-shared-toolkit';
import { SdmxApiConfig } from './sdmx-config';

export class SdmxApiClient {
  public readonly config: SdmxApiConfig;

  constructor(config: SdmxApiConfig) {
    this.config = config;

    console.info('SdmxApiClient initialized', {
      apiUrl: config.apiUrl || 'NOT SET',
    });
  }

  async getRequest<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  async postRequest<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request(endpoint, { ...options, method: 'POST' });
  }

  async streamRequest(
    endpoint: string,
    options: RequestOptions,
    filename: string,
  ): Promise<Response> {
    const url = `${this.config.apiUrl}/${endpoint}`;

    const headers = {
      ...getHeaders(void 0, {
        jwt: this.config.jwt,
      }),
      ...options.headers,
    };

    if (this.config.apiKey != null) {
      headers['Ocp-Apim-Subscription-Key'] = this.config.apiKey;
    }

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await sendRequest(url, headers, options);
          if (!response.ok) {
            const errorBody = await response.text();
            console.error(
              `Fetch failed! Status: ${response.status}, Body: ${errorBody}`,
            );
            throw new Error(`Fetch failed with status ${response.status}`);
          }

          const reader = response.body?.getReader();
          if (!reader) throw new Error('Failed to create stream reader');
          const utf8Bom = new Uint8Array([0xef, 0xbb, 0xbf]);
          controller.enqueue(utf8Bom);

          const pump = async (): Promise<void> => {
            const { done, value } = await reader.read();
            if (done) {
              controller.close();
            } else {
              controller.enqueue(value);
              await pump();
            }
          };

          pump();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    const responseHeaders = new Headers({
      'Content-Disposition': `attachment; filename=${encodeURIComponent(filename)}`,
    });

    return new Response(stream, { headers: responseHeaders });
  }

  async request<T>(endpoint: string, options: RequestOptions): Promise<T> {
    const startTime = Date.now();

    const url =
      endpoint.includes('availability') && !!this.config.constrainsApiUrl
        ? `${this.config.constrainsApiUrl}/${endpoint}`
        : `${this.config.apiUrl}/${endpoint}`;
    const headers = {
      ...getHeaders(void 0, {
        jwt: this.config.jwt,
      }),
      ...options.headers,
    };

    if (this.config.apiKey != null) {
      headers['Ocp-Apim-Subscription-Key'] = this.config.apiKey;
    }

    this.addInfoRequestLog('API Request', url, options, headers);

    try {
      const response = await sendRequest(url, headers, options);

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
      responseText: responseText.substring(0, 200),
      error: 'Response is not valid JSON',
    });
  }
}
