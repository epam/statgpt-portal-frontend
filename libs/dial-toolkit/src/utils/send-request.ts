import { RequestOptions } from '@epam/statgpt-shared-toolkit';

export const sendRequest = async (
  url: string,
  headers: Record<string, string>,
  options: RequestOptions,
) => {
  const body =
    options?.body === undefined
      ? undefined
      : options?.isFormData
        ? (options.body as BodyInit)
        : JSON.stringify(options.body);

  return await fetch(url, {
    method: options.method || 'GET',
    headers,
    body,
    signal: options?.signal,
  });
};
