import { ApiResponse, HTTP_ERROR_CODES } from '@epam/statgpt-shared-toolkit';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
}

async function handleResponse<T>(
  response: Response,
  errorMessage: string,
): Promise<ApiResponse<T>> {
  if (!response.ok) {
    if (response.status === HTTP_ERROR_CODES.UNAUTHORIZED) {
      return {
        success: false,
        data: undefined,
        statusCode: HTTP_ERROR_CODES.UNAUTHORIZED,
      };
    }
    const errorText = await response.text();
    throw new Error(
      `${errorMessage}: ${response.status} ${response.statusText} - ${errorText.substring(0, 100)}`,
    );
  }

  const data = await response.json();
  return { success: true, data };
}

async function handleVoidResponse(
  response: Response,
  errorMessage: string,
): Promise<ApiResponse<void>> {
  if (!response.ok) {
    if (response.status === HTTP_ERROR_CODES.UNAUTHORIZED) {
      return {
        success: false,
        data: undefined,
        statusCode: HTTP_ERROR_CODES.UNAUTHORIZED,
      };
    }
    const errorText = await response.text();
    throw new Error(
      `${errorMessage}: ${response.status} ${response.statusText} - ${errorText.substring(0, 100)}`,
    );
  }

  return { success: true, data: undefined };
}

function buildFetchOptions(options?: RequestOptions): RequestInit {
  const fetchOptions: RequestInit = {};

  if (options?.method) {
    fetchOptions.method = options.method;
  }

  if (options?.body !== undefined) {
    fetchOptions.headers = { 'Content-Type': 'application/json' };
    fetchOptions.body = JSON.stringify(options.body);
  }

  return fetchOptions;
}

/**
 * Makes an API request and returns ApiResponse<T> format.
 * Handles 401 errors by returning unauthorized response.
 */
export async function apiRequest<T>(
  url: string,
  errorMessage: string,
  options?: RequestOptions,
): Promise<ApiResponse<T>> {
  const response = await fetch(url, buildFetchOptions(options));
  return handleResponse<T>(response, errorMessage);
}

/**
 * Makes an API request for endpoints that don't return data.
 * Returns ApiResponse<void> format.
 */
export async function apiRequestVoid(
  url: string,
  errorMessage: string,
  options?: RequestOptions,
): Promise<ApiResponse<void>> {
  const response = await fetch(url, buildFetchOptions(options));
  return handleVoidResponse(response, errorMessage);
}

/**
 * Makes an API request and returns the raw blob response.
 * Used for file downloads.
 */
export async function apiRequestBlob(
  url: string,
  errorMessage: string,
): Promise<ApiResponse<Blob>> {
  const response = await fetch(url);

  if (!response.ok) {
    if (response.status === HTTP_ERROR_CODES.UNAUTHORIZED) {
      return {
        success: false,
        data: undefined,
        statusCode: HTTP_ERROR_CODES.UNAUTHORIZED,
      };
    }
    const errorText = await response.text();
    throw new Error(
      `${errorMessage}: ${response.status} ${response.statusText} - ${errorText.substring(0, 100)}`,
    );
  }

  const data = await response.blob();
  return { success: true, data };
}
