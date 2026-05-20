import { ApiResponse, HTTP_ERROR_CODES } from '@epam/statgpt-shared-toolkit';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
}

interface CustomRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: BodyInit;
  headers?: HeadersInit;
}

async function handleErrorResponse(
  response: Response,
  errorMessage: string,
): Promise<{
  success: false;
  data: undefined;
  statusCode: number;
  message?: string;
} | null> {
  if (response.ok) return null;

  if (response.status === HTTP_ERROR_CODES.UNAUTHORIZED) {
    return {
      success: false,
      data: undefined,
      statusCode: HTTP_ERROR_CODES.UNAUTHORIZED,
    };
  }

  const errorText = await response.text();
  let errorDetails: unknown = errorText;
  try {
    const parsed = JSON.parse(errorText) as Record<string, unknown>;
    errorDetails = parsed?.error ?? parsed;
  } catch {
    // keep raw text if body is not JSON
  }

  console.error('[API Error]', {
    operation: errorMessage,
    status: response.status,
    error: errorDetails,
  });

  return {
    success: false,
    data: undefined,
    statusCode: response.status,
    message: `${errorMessage}: ${response.status} ${response.statusText}`,
  };
}

async function handleResponse<T>(
  response: Response,
  errorMessage: string,
): Promise<ApiResponse<T>> {
  const errorResult = await handleErrorResponse(response, errorMessage);
  if (errorResult) return errorResult;
  const data = await response.json();
  return { success: true, data };
}

async function handleVoidResponse(
  response: Response,
  errorMessage: string,
): Promise<ApiResponse<void>> {
  const errorResult = await handleErrorResponse(response, errorMessage);
  if (errorResult) return errorResult;
  return { success: true, data: undefined };
}

function buildFetchOptions(options?: RequestOptions): RequestInit {
  const fetchOptions: RequestInit = {};

  if (options?.method) {
    fetchOptions.method = options.method;
  }

  if (options?.body !== undefined) {
    fetchOptions.headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    fetchOptions.body = JSON.stringify(options.body);
  } else if (options?.headers) {
    fetchOptions.headers = options.headers;
  }

  return fetchOptions;
}

export async function apiRequest<T>(
  url: string,
  errorMessage: string,
  options?: RequestOptions,
): Promise<ApiResponse<T>> {
  const response = await fetch(url, buildFetchOptions(options));
  return handleResponse<T>(response, errorMessage);
}

export async function apiRequestVoid(
  url: string,
  errorMessage: string,
  options?: RequestOptions,
): Promise<ApiResponse<void>> {
  const response = await fetch(url, buildFetchOptions(options));
  return handleVoidResponse(response, errorMessage);
}

export async function apiRequestBlob(
  url: string,
  errorMessage: string,
): Promise<ApiResponse<Blob>> {
  const response = await fetch(url);
  const errorResult = await handleErrorResponse(response, errorMessage);
  if (errorResult) return errorResult;
  const data = await response.blob();
  return { success: true, data };
}

export async function apiRequestVoidWithOptions(
  url: string,
  errorMessage: string,
  options?: CustomRequestOptions,
): Promise<ApiResponse<void>> {
  const response = await fetch(url, {
    method: options?.method,
    body: options?.body,
    headers: options?.headers,
  });

  return handleVoidResponse(response, errorMessage);
}
