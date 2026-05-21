/* eslint-disable @nx/enforce-module-boundaries */
'use client';

import { createContext, ReactNode, useContext } from 'react';
import { ConversationInfo, Conversation } from '@epam/ai-dial-shared';
import { ShareConversationProps } from '@statgpt/share-conversation/src/models/share-conversation';

export interface ConversationListActionsContextValue {
  locale: string;
  deleteConversation: (conversation: ConversationInfo) => Promise<void>;
  renameConversation: (
    conversationId: string,
    updatedId: string,
  ) => Promise<unknown>;
  getConversation: (conversationId: string) => Promise<Conversation>;
  getFileBlob: (path: string) => Promise<Blob>;
  shareConversationProps?: ShareConversationProps;
}

const ConversationListActionsContext =
  createContext<ConversationListActionsContextValue | null>(null);

export function ConversationListActionsProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: ConversationListActionsContextValue;
}) {
  return (
    <ConversationListActionsContext.Provider value={value}>
      {children}
    </ConversationListActionsContext.Provider>
  );
}

export function useConversationListActions(): ConversationListActionsContextValue {
  const context = useContext(ConversationListActionsContext);
  if (!context) {
    throw new Error(
      'useConversationListActions must be used within ConversationListActionsProvider',
    );
  }
  return context;
}
