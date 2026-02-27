'use client';

import {
  ConversationViewMessages,
  ConversationViewMessagesProvider,
} from '@epam/statgpt-conversation-view';
import { ReactNode, useMemo } from 'react';
import { TranslateI18nFn, useI18n } from '../../../locales/client';
import { StatusMessagesI18nKeys } from '../../../constants/i18n-keys';

export const TextsConfig = ({
  children,
  clientContactSupportUrl,
}: {
  children: ReactNode;
  clientContactSupportUrl?: string;
}) => {
  const t = useI18n() as TranslateI18nFn;

  const assistantUnavailable = useMemo(() => {
    const href = clientContactSupportUrl || '#';

    return t(StatusMessagesI18nKeys.AGENT_UNAVAILABLE_ALERT, {
      link: (
        <a
          className="underline"
          href={href}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t(StatusMessagesI18nKeys.CONTACT_SUPPORT)}
        </a>
      ),
    });
  }, [clientContactSupportUrl, t]);

  const conversationViewMessagesCustomConfig: ConversationViewMessages = {
    statusMessages: {
      assistantUnavailable,
      serverError: t(StatusMessagesI18nKeys.SERVER_ERROR),
      serverOverloaded: t(StatusMessagesI18nKeys.SERVER_OVERLOADED),
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
