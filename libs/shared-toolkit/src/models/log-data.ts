export interface LogData {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: unknown;
}
