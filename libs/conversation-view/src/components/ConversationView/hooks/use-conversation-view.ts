'use client';

import {
  CUSTOM_VIEW_STATE_KEY,
  CustomViewState,
} from '@epam/statgpt-dial-toolkit';
import { useAgentAvailability } from '@epam/statgpt-ui-components';
import { useMemo } from 'react';

import { useAdvancedView } from '../../../context/AdvancedViewContext';
import { useChatMessages } from '../../../context/ChatMessagesContext';
import { useConversationViewFeatureToggles } from '../../../context/ConversationViewFeatureTogglesContext';
import { useConversationViewMessages } from '../../../context/ConversationViewMessagesContext';
import { useCrossDatasetAttachments } from '../../../context/CrossDatasetAttachmentsContext';
import { useOnboarding } from '../../../context/OnboardingContext';
import { ConversationViewProps } from '../types';
import { useConversationLifecycle } from './use-conversation-lifecycle';
import { useConversationLoader } from './use-conversation-loader';
import { useConversationSaver } from './use-conversation-saver';
import { useConversationStreaming } from './use-conversation-streaming';
import { useMessageFeedback } from './use-message-feedback';
import { useMessageMutations } from './use-message-mutations';
import { useOnboardingSync } from './use-onboarding-sync';

/**
 * Orchestrates the ConversationView feature: reads the shared contexts once and
 * composes the focused sub-hooks — saver → message mutations → streaming →
 * feedback → lifecycle → loader, plus the standalone `useOnboardingSync`
 * effects — then returns a flat view-model object consumed by the presentational
 * layout. Mirrors the `useFilters` orchestration pattern. The only hard ordering
 * constraint is that streaming is wired before the loader, since the loader
 * auto-sends the first message via `sendMessageToConversation`.
 */
export const useConversationView = (props: ConversationViewProps) => {
  const {
    conversationKey,
    conversation,
    actions,
    locale,
    conversationsRoute,
    token,
    handleInvalidStreaming,
    onConversationNotFound,
    setConversation,
    setConversations,
    openUrl,
  } = props;

  const { isStreaming, setIsStreaming } = useChatMessages();
  const { isOpenedAdvancedView } = useAdvancedView();
  const { setCrossDatasetAttachmentsState } = useCrossDatasetAttachments();
  const { isCrossDatasetModeOn } = useConversationViewFeatureToggles();
  const { isAgentAvailable } = useAgentAvailability();
  const { statusMessages } = useConversationViewMessages();
  const { isShowOnboarding } = useOnboarding();

  useOnboardingSync({ actions });

  const saveConversation = useConversationSaver({ actions, conversationKey });

  const {
    addUserMessageToConversation,
    initializeAssistantMessage,
    updateAssistantMessage,
  } = useMessageMutations({ setConversation });

  const {
    sendMessageToConversation,
    regenerateMessage,
    editMessage,
    onStopStreaming,
    isLastMessageFailed,
    regenerateLastMessage,
  } = useConversationStreaming({
    conversation,
    setConversation,
    saveConversation,
    updateAssistantMessage,
    addUserMessageToConversation,
    initializeAssistantMessage,
    isStreaming,
    setIsStreaming,
    statusMessages,
    isCrossDatasetModeOn,
    token,
    handleInvalidStreaming,
  });

  const { rateResponse, handleCodeAttachmentUpdated } = useMessageFeedback({
    actions,
    conversation,
    setConversation,
    saveConversation,
  });

  const { duplicateConversation, handleOpeningOfNewConversation } =
    useConversationLifecycle({
      actions,
      conversation,
      locale,
      conversationsRoute,
      openUrl,
      setConversations,
    });

  const { isLoading, isReadonlyConversation } = useConversationLoader({
    conversationKey,
    actions,
    setConversation,
    setCrossDatasetAttachmentsState,
    sendMessageToConversation,
    onConversationNotFound,
  });

  const messageServerActions = useMemo(
    () => ({
      getFile: actions.getFile,
      putOnboardingFile: actions.putOnboardingFile,
      getDataSet: actions.getDataSet,
      getDataSetData: actions.getDataSetData,
      getConstraints: actions.getConstraints,
      updateCurrentDataQuery: actions.updateCurrentDataQuery,
      updateDataQueries: actions.updateDataQueries,
      updateDatasets: actions.updateDatasets,
      downloadDataSet: actions.downloadDataSet,
    }),
    [actions],
  );

  const conversationViewState = conversation?.customViewState?.[
    CUSTOM_VIEW_STATE_KEY
  ] as CustomViewState | undefined;

  return {
    isLoading,
    isReadonlyConversation,
    isStreaming,
    isOpenedAdvancedView,
    isShowOnboarding,
    isAgentAvailable,
    statusMessages,
    conversationViewState,
    messageServerActions,
    sendMessageToConversation,
    regenerateMessage,
    editMessage,
    onStopStreaming,
    isLastMessageFailed,
    regenerateLastMessage,
    rateResponse,
    handleCodeAttachmentUpdated,
    duplicateConversation,
    handleOpeningOfNewConversation,
  };
};

export type ConversationViewModel = ReturnType<typeof useConversationView>;
