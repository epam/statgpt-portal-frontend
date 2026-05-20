'use client';

import { createContext, useContext } from 'react';
import { ConversationStyles } from '../models/conversation-list';

export const ConversationStylesContext =
  createContext<ConversationStyles | null>(null);

export function useConversationStyles(): ConversationStyles {
  const context = useContext(ConversationStylesContext);
  if (!context) {
    throw new Error(
      'useConversationStyles must be used within ConversationStylesContext.Provider',
    );
  }
  return context;
}
