import { ExceededLimit } from '@epam/statgpt-dial-toolkit';
import { ReactNode } from 'react';

export interface ConversationViewMessages {
  statusMessages: {
    assistantUnavailable: ReactNode;
    serverError: string;
    serverOverloaded: string;
    contentFilterError: string;
    getAssistantRestoreMessage: (date: string, time: string) => string;
    getExceededLimitsMessage: (limits: ExceededLimit[]) => string;
  };
}
