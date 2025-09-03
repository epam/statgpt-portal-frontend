import { Role, Message } from '@epam/ai-dial-shared';
import { ModelInfo } from '@statgpt/dial-toolkit/src/models/model';

export interface RequestStreamBody {
  conversationId: string;
  messages: Message[];
  model: ModelInfo;
  content?: string;
}

export interface MessageStreamResponse {
  id?: string;
  content?: string;
  choices: MessageChoices[];
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
