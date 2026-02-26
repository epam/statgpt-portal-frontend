import { ReactNode } from 'react';

export interface ConversationViewMessages {
  statusMessages: {
    assistantUnavailable: ReactNode;
    serverError: string;
    serverOverloaded: string;
  };
}
