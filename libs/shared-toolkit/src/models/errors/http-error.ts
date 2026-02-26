export interface HttpErrorPayload<D = unknown> {
  status: number; // HTTP status
  message: string; // user-safe message
  details?: D; // optional diagnostics/context, JSON-serializable
}

export class HttpError<D = unknown> extends Error {
  readonly status: number;
  readonly details?: D;

  constructor(payload: HttpErrorPayload<D>) {
    super(payload.message);
    this.name = 'HttpError';
    this.status = payload.status;
    this.details = payload.details;
  }
}
