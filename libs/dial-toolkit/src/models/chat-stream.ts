import { Role, Message } from '@epam/ai-dial-shared';
import { ModelInfo } from './model';
import { ExceededLimit } from './custom-view';

export interface RequestStreamBody {
  conversationId: string;
  messages: Message[];
  model: ModelInfo;
  content?: string;
  custom_fields?: CustomFields['custom_fields'];
}

export interface MessageStreamResponse {
  id?: string;
  content?: string;
  choices: MessageChoices[];
  error?: MessageStreamError;
}

export interface MessageStreamError {
  message: string;
  display_message?: string;

  // Error category (e.g. "runtime_error", "rate_limit_exceeded")
  type?: string;

  // Error code (e.g. "content_filter", "500")
  code?: string;

  // HTTP status code (e.g. 400)
  status?: number;

  // Time to wait before retrying, in seconds (e.g. "79200")
  retry_after?: string;

  exceeded_limit?: ExceededLimit[];
}

export interface CustomFields {
  custom_fields?: {
    configuration?: {
      choice?: string;
      merge_python_code?: boolean;
      timezone?: string;
    };
  };
}

export interface MessageChoices {
  delta: {
    content?: string;
    role?: Role;
    custom_content?: unknown;
  };
  message: { content?: string };
  finish_reason?: string;
}

export interface MessageState {
  error_details?: {
    retry_after?: number;
    body?: {
      message?: string;
      display_message?: string;
      code?: string;
    };
  };
}
