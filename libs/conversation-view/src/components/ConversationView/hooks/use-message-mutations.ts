'use client';

import { Conversation, Role } from '@epam/ai-dial-shared';
import { mergeMessages, Message } from '@epam/statgpt-dial-toolkit';
import { Dispatch, SetStateAction, useCallback } from 'react';

export interface UseMessageMutationsArgs {
  setConversation: Dispatch<SetStateAction<Conversation | null>>;
}

/**
 * Local message-state mutations on the in-memory conversation: appending the
 * user message, seeding an empty assistant message, and merging updates
 * (streamed partials, or an error message) into that assistant message by id.
 * Touches React state only — no persistence or network.
 */
export const useMessageMutations = ({
  setConversation,
}: UseMessageMutationsArgs) => {
  const addUserMessageToConversation = useCallback(
    (userMessage: Message) => {
      setConversation((prev) =>
        prev
          ? {
              ...prev,
              messages: [...(prev?.messages || []), userMessage],
            }
          : null,
      );
    },
    [setConversation],
  );

  const initializeAssistantMessage = useCallback(() => {
    const assistantMessage: Message = {
      id: `msg-${Date.now() + 1}`,
      role: Role.Assistant,
      content: '',
      timestamp: Date.now(),
    };

    setConversation((prev) =>
      prev
        ? {
            ...prev,
            messages: [...prev.messages, assistantMessage],
          }
        : null,
    );
    return assistantMessage;
  }, [setConversation]);

  const updateAssistantMessage = useCallback(
    (assistantMessage: Message, partialMessage: Partial<Message>) => {
      const updatedMessage = mergeMessages?.(assistantMessage, [
        partialMessage,
      ]);

      if (!updatedMessage) {
        return;
      }

      setConversation((prev) =>
        prev
          ? {
              ...prev,
              messages: (prev.messages as Message[]).map((msg) =>
                msg.id === assistantMessage.id ? { ...updatedMessage } : msg,
              ),
            }
          : null,
      );

      return updatedMessage;
    },
    [setConversation],
  );

  return {
    addUserMessageToConversation,
    initializeAssistantMessage,
    updateAssistantMessage,
  };
};
