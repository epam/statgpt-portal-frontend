'use client';

import { Conversation, Role } from '@epam/ai-dial-shared';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';

import { ConversationViewActions } from '../../../models/actions';
import { clearRequestCache } from '../../../utils/request-cache';
import {
  isConversationIdExternal,
  isReadOnlyConversation,
} from '../../../utils/is-read-only-conversation';

export interface UseConversationLoaderArgs {
  conversationKey: string;
  actions: ConversationViewActions;
  setConversation: Dispatch<SetStateAction<Conversation | null>>;
  setCrossDatasetAttachmentsState: () => void;
  sendMessageToConversation: (
    content: string,
    data: Conversation | null,
    customChoiceId?: string,
  ) => void;
  onConversationNotFound?: () => void;
}

/**
 * Loads the conversation for the current `conversationKey`, derives its
 * read-only flag, and sends the stored `prompt` to start the first turn when
 * there are no user messages yet (an empty conversation, or one holding only a
 * seed assistant message). Owns the `isLoading` / `isReadonlyConversation` UI
 * state and clears the request cache around each load. On failure it marks the
 * conversation read-only and calls `onConversationNotFound`. Re-fetches only
 * when `conversationKey` changes.
 */
export const useConversationLoader = ({
  conversationKey,
  actions,
  setConversation,
  setCrossDatasetAttachmentsState,
  sendMessageToConversation,
  onConversationNotFound,
}: UseConversationLoaderArgs) => {
  const [isReadonlyConversation, setIsReadonlyConversation] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    clearRequestCache();
    setCrossDatasetAttachmentsState();

    async function fetchConversationById() {
      try {
        setIsLoading(true);
        const { bucket } = await actions.getBucket();
        const data = await actions.getConversation(decodeURI(conversationKey));

        setConversation(data);
        setIsReadonlyConversation(
          isReadOnlyConversation(data) &&
            isConversationIdExternal(data, bucket),
        );
        if (
          data.messages.length === 0 ||
          (data?.messages?.[0]?.role === Role.Assistant &&
            data?.messages?.length === 1)
        ) {
          sendMessageToConversation(data.prompt, data);
        }
      } catch {
        setIsReadonlyConversation(true);
        onConversationNotFound?.();
      } finally {
        setIsLoading(false);
      }
    }

    if (conversationKey) {
      fetchConversationById();
    }

    return () => {
      clearRequestCache();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationKey]);

  return {
    isLoading,
    isReadonlyConversation,
  };
};
