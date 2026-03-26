export interface HttpErrorPayload<D = unknown> {
  status: number; // HTTP status
  code?: string; // logical code of error
  message: string;
  displayMessage?: string;
  details?: D; // optional diagnostics/context, JSON-serializable
}

export class HttpError<D = unknown> extends Error {
  readonly code?: string;
  readonly status: number;
  readonly details?: D;
  readonly isHttpError = true;
  readonly displayMessage?: string;

  constructor(payload: HttpErrorPayload<D>) {
    super(payload.message);
    this.name = 'HttpError';
    this.code = payload.code;
    this.status = payload.status;
    this.details = payload.details;
    this.displayMessage = payload.displayMessage;
  }
}

export function isHttpError(e: unknown): e is HttpError {
  const err = e as Record<string, unknown>;
  return (
    typeof e === 'object' &&
    e !== null &&
    err['isHttpError'] === true &&
    typeof err['status'] === 'number' &&
    typeof err['message'] === 'string' &&
    (err['code'] === undefined || typeof err['code'] === 'string')
  );
}
