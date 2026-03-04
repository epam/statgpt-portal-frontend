export interface HttpErrorPayload<D = unknown> {
  status: number; // HTTP status
  code?: string; // logical code of error
  message: string; // user-safe message
  details?: D; // optional diagnostics/context, JSON-serializable
}

export class HttpError<D = unknown> extends Error {
  readonly code?: string;
  readonly status: number;
  readonly details?: D;
  readonly isHttpError = true;

  constructor(payload: HttpErrorPayload<D>) {
    super(payload.message);
    this.name = 'HttpError';
    this.code = payload.code;
    this.status = payload.status;
    this.details = payload.details;
  }
}

export function isHttpError(e: unknown): e is HttpError {
  return (
    typeof e === 'object' &&
    e !== null &&
    (e as any).isHttpError === true &&
    typeof (e as any).status === 'number' &&
    typeof (e as any).message === 'string' &&
    ((e as any).code === undefined || typeof (e as any).code === 'string')
  );
}
