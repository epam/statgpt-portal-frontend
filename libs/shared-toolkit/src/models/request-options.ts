export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  jwt?: string;
  chatReference?: string;
  signal?: AbortSignal;
}
