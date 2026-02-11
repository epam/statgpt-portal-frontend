'use client';

import {
  ConversationViewMessages,
  ConversationViewMessagesProvider,
} from '@epam/statgpt-conversation-view';
import { ReactNode } from 'react';
import { useI18n } from '../../locales/client';
import { ConversationI18nKeys } from '../../constants/i18n-keys';

export const TextsConfig = ({ children }: { children: ReactNode }) => {
  const t = useI18n();

  const conversationViewMessagesCustomConfig: ConversationViewMessages = {
    statusMessages: {
      assistantUnavailable:
        t(ConversationI18nKeys.AGENT_UNAVAILABLE) ||
        'The AI Assistant is unavailable. To gain access, please contact Support.',
    },
  };

  return (
    <ConversationViewMessagesProvider
      value={conversationViewMessagesCustomConfig}
    >
      {children}
    </ConversationViewMessagesProvider>
  );
};
