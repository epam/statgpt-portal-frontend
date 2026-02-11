'use client';

import { createContext, ReactNode, useContext, useMemo } from 'react';
import { ConversationViewMessages } from '../types/texts';

const ConversationViewMessagesContext =
  createContext<ConversationViewMessages | null>(null);

export interface ConversationViewMessagesProviderProps {
  value: ConversationViewMessages;
  children: ReactNode;
}

export function ConversationViewMessagesProvider({
  value,
  children,
}: ConversationViewMessagesProviderProps) {
  const memo = useMemo(() => value, [value]);

  return (
    <ConversationViewMessagesContext.Provider value={memo}>
      {children}
    </ConversationViewMessagesContext.Provider>
  );
}

export function useConversationViewMessages() {
  const context = useContext(ConversationViewMessagesContext);

  if (!context) {
    throw new Error(
      'useConversationViewMessages must be used within ConversationViewMessagesProvider',
    );
  }

  return context;
}
