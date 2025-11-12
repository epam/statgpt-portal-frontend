import { RequestOptions } from '../models/request-options';

export const sendRequest = async (
  url: string,
  headers: Record<string, string>,
  options: RequestOptions,
) => {
  try {
    return await fetch(url, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch (e) {
    console.error('Send request failed', e);
    return new Promise(() => null);
  }
};
