import { Role, Message } from '@epam/ai-dial-shared';
import { ModelInfo } from './model';

export interface RequestStreamBody {
  conversationId: string;
  messages: Message[];
  model: ModelInfo;
  content?: string;
  custom_fields?: CustomFields;
}

export interface MessageStreamResponse {
  id?: string;
  content?: string;
  choices: MessageChoices[];
  error?: MessageStreamError;
}

export interface MessageStreamError {
  message: string;
  type?: string;
  param?: string;
  code?: string;
  status?: number;
}

export interface CustomFields {
  custom_fields?: {
    configuration?: {
      choice?: string;
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
