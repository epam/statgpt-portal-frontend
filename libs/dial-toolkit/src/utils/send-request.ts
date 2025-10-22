import { RequestOptions } from '@epam/statgpt-shared-toolkit';

export const sendRequest = async (
  url: string,
  headers: Record<string, string>,
  options: RequestOptions,
) => {
  return await fetch(url, {
    method: options.method || 'GET',
    headers,
    body:
      options?.isFormData && typeof options?.body === 'string'
        ? options.body
        : JSON.stringify(options.body),
    signal: options?.signal,
  });
};
