'use client';

import { ConversationInfo } from '@epam/ai-dial-shared';
import { createContext, FC, ReactNode, useContext, useState } from 'react';

interface ConversationListContextType {
  conversations: ConversationInfo[];
  sharedConversations: ConversationInfo[];
  setConversations: (conversations: ConversationInfo[]) => void;
  setSharedConversations: (sharedConversations: ConversationInfo[]) => void;
}

const ConversationListContext = createContext<
  ConversationListContextType | undefined
>(undefined);

export const ConversationListProvider: FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [conversations, setConversations] = useState<ConversationInfo[]>([]);
  const [sharedConversations, setSharedConversations] = useState<
    ConversationInfo[]
  >([]);

  return (
    <ConversationListContext.Provider
      value={{
        conversations,
        sharedConversations,
        setConversations,
        setSharedConversations,
      }}
    >
      {children}
    </ConversationListContext.Provider>
  );
};

export const useConversationList = () => {
  const context = useContext(ConversationListContext);
  if (context === undefined) {
    throw new Error(
      'useConversationList must be used within a ConversationListProvider',
    );
  }
  return context;
};
