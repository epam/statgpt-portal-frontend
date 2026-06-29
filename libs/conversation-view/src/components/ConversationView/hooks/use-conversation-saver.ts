'use client';

import { Conversation } from '@epam/ai-dial-shared';
import { useCallback } from 'react';
import { ConversationViewActions } from '../../../models/actions';

export interface UseConversationSaverArgs {
  actions: ConversationViewActions;
  conversationKey: string;
}

/**
 * Persists the conversation back to the DIAL API via `actions.updateConversation`
 * — only `name`, `messages` and `customViewState` are sent. Failures are logged
 * and swallowed (the local state is left untouched). Shared by the streaming and
 * message-feedback flows, which both flush local edits to the server.
 */
export const useConversationSaver = ({
  actions,
  conversationKey,
}: UseConversationSaverArgs) => {
  const saveConversation = useCallback(
    async (updatedConversation: Conversation) => {
      try {
        await actions.updateConversation(decodeURI(conversationKey), {
          name: updatedConversation.name,
          messages: updatedConversation.messages,
          customViewState: updatedConversation.customViewState,
        });
      } catch (err) {
        console.error('Failed to save conversation:', err);
      }
    },
    [actions, conversationKey],
  );

  return saveConversation;
};
