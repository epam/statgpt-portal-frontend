import { ApiResponse, HTTP_ERROR_CODES } from '@statgpt/shared-toolkit/src';

export type AuthHandler = <Args extends any[], T>(
  action: (...args: Args) => Promise<ApiResponse<T>>,
) => (...args: Args) => Promise<T>;

export function wrapWithAuthHandler<Args extends any[], T>(
  apiReqFn: (...args: Args) => Promise<ApiResponse<T>>,
  redirectToSignIn: () => void,
): (...args: Args) => Promise<T> {
  return async (...args: Args) => {
    const response = await apiReqFn(...args);
    if (!response) {
      return {} as T;
    }
    if (!response.success) {
      if (response.statusCode === HTTP_ERROR_CODES.UNAUTHORIZED) {
        redirectToSignIn();
      }
      throw new Error(response.message || 'Unknown API error');
    }
    return response.data as T;
  };
}
