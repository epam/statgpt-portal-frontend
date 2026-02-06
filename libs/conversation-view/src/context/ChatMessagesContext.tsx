'use client';

import { createContext, FC, ReactNode, useContext, useState } from 'react';

interface ChatMessagesContextType {
  isStreaming: boolean;
  setIsStreaming: (isStreaming: boolean) => void;
}

const ChatMessagesContext = createContext<ChatMessagesContextType | undefined>(
  undefined,
);

export const ChatMessagesProvider: FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isStreaming, setIsStreaming] = useState(false);

  return (
    <ChatMessagesContext.Provider
      value={{
        isStreaming,
        setIsStreaming,
      }}
    >
      {children}
    </ChatMessagesContext.Provider>
  );
};

export const useChatMessages = () => {
  const context = useContext(ChatMessagesContext);
  if (context === undefined) {
    throw new Error(
      'useChatMessages must be used within a ChatMessagesProvider',
    );
  }
  return context;
};
