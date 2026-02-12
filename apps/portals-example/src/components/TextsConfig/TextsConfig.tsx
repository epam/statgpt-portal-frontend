'use client';

import {
  ConversationViewMessages,
  ConversationViewMessagesProvider,
} from '@epam/statgpt-conversation-view';
import { ReactNode, useMemo } from 'react';
import { I18nTranslateFn, useI18n } from '../../locales/client';
import { ConversationI18nKeys } from '../../constants/i18n-keys';

export const TextsConfig = ({
  children,
  clientContactSupportUrl,
}: {
  children: ReactNode;
  clientContactSupportUrl?: string;
}) => {
  const t = useI18n() as I18nTranslateFn;

  const assistantUnavailable = useMemo(() => {
    const href = clientContactSupportUrl || '#';

    const linkText =
      t(ConversationI18nKeys.CONTACT_SUPPORT) ?? 'contact Support';

    return t(ConversationI18nKeys.AGENT_UNAVAILABLE, {
      link: (
        <a
          className="underline"
          href={href}
          target="_blank"
          rel="noopener noreferrer"
        >
          {linkText}
        </a>
      ),
    });
  }, [clientContactSupportUrl, t]);

  const conversationViewMessagesCustomConfig: ConversationViewMessages = {
    statusMessages: {
      assistantUnavailable,
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
