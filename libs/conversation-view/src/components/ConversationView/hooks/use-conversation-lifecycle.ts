'use client';

import { Conversation, ConversationInfo } from '@epam/ai-dial-shared';
import { cleanConversationNames } from '@epam/statgpt-shared-toolkit';
import { useCallback } from 'react';

import { ConversationViewActions } from '../../../models/actions';
import { duplicateConversationAttachments } from '../../../utils/duplicate-conversation-attachments';
import { generateConversation } from '../../../utils/generate-conversation';
import { getRedirectConversationPath } from '../../../utils/get-conversation-path';

export interface UseConversationLifecycleArgs {
  actions: ConversationViewActions;
  conversation: Conversation | null;
  locale: string;
  conversationsRoute?: string;
  openUrl: (url: string) => void;
  setConversations: (conversations: ConversationInfo[]) => void;
}

/**
 * Conversation-level actions: duplicating the current (read-only) conversation
 * — copying its attachments when the file actions are available, then creating
 * the copy, refreshing the conversation list and navigating to it — and opening
 * a fresh conversation from the onboarding footer.
 */
export const useConversationLifecycle = ({
  actions,
  conversation,
  locale,
  conversationsRoute,
  openUrl,
  setConversations,
}: UseConversationLifecycleArgs) => {
  const handleOpeningOfNewConversation = useCallback(() => {
    openUrl(`/${locale}${conversationsRoute}`);
  }, [locale, conversationsRoute, openUrl]);

  const duplicateConversation = useCallback(async () => {
    try {
      const { bucket } = await actions.getBucket();
      const conversationWithDuplicatedAttachments =
        actions.getFileBlob && actions.putFile
          ? await duplicateConversationAttachments({
              conversation: conversation as Conversation,
              bucket,
              getFileBlob: actions.getFileBlob,
              putFile: actions.putFile,
            })
          : (conversation as Conversation);
      const newConversation = generateConversation(
        conversationWithDuplicatedAttachments,
        bucket,
        locale,
      );

      await actions.createConversation(newConversation, locale);

      const conversationsData = await actions.getConversations(locale);
      setConversations(cleanConversationNames(conversationsData));
      openUrl(
        getRedirectConversationPath(
          newConversation,
          locale,
          conversationsRoute,
        ),
      );
    } catch (err) {
      console.error('Failed to save conversation:', err);
    }
  }, [
    actions,
    conversation,
    conversationsRoute,
    locale,
    openUrl,
    setConversations,
  ]);

  return {
    handleOpeningOfNewConversation,
    duplicateConversation,
  };
};
