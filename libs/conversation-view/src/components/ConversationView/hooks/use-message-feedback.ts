'use client';

import { Attachment, Conversation, LikeState } from '@epam/ai-dial-shared';
import { Message } from '@epam/statgpt-dial-toolkit';
import { merge } from 'lodash';
import { Dispatch, SetStateAction, useCallback } from 'react';

import { ConversationViewActions } from '../../../models/actions';
import { replacePythonAttachment } from '../../../utils/attachments/replace-python-attachment';

export interface UseMessageFeedbackArgs {
  actions: ConversationViewActions;
  conversation: Conversation | null;
  setConversation: Dispatch<SetStateAction<Conversation | null>>;
  saveConversation: (conversation: Conversation) => Promise<void>;
}

/**
 * Per-message feedback actions: rating a response (thumbs up/down) and
 * replacing a Python code attachment after an in-place edit. Both persist the
 * resulting conversation. `rateResponse` mutates `conversation.messages` in
 * place — preserved as-is from the original component.
 */
export const useMessageFeedback = ({
  actions,
  conversation,
  setConversation,
  saveConversation,
}: UseMessageFeedbackArgs) => {
  const handleCodeAttachmentUpdated = useCallback(
    (messageId: string, newRawAttachment: Attachment) => {
      if (!conversation) return;
      const updatedMessages = replacePythonAttachment(
        conversation.messages as Message[],
        newRawAttachment,
        messageId,
      );
      if (!updatedMessages) return;
      const updatedConversation = {
        ...conversation,
        messages: updatedMessages,
      };
      setConversation(updatedConversation);
      saveConversation(updatedConversation);
    },
    [conversation, setConversation, saveConversation],
  );

  const rateResponse = useCallback(
    (id: string, rate: LikeState) => {
      if (conversation?.model?.id) {
        actions.rateResponse(
          id,
          rate === LikeState.Liked,
          conversation.model.id,
        );

        conversation.messages = conversation.messages.map((msg) =>
          msg.responseId === id ? merge(msg, { like: rate }) : msg,
        );

        saveConversation(conversation);
      }
    },
    [actions, conversation, saveConversation],
  );

  return {
    handleCodeAttachmentUpdated,
    rateResponse,
  };
};
