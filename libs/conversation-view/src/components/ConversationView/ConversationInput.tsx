'use client';

import {
  CustomViewState,
  ERROR_CONTEXT_KIND,
  formatDateTime,
  getRateLimitRestoreDate,
  isRateLimitStillActive,
} from '@epam/statgpt-dial-toolkit';
import { InlineAlert, InlineAlertType } from '@epam/statgpt-ui-components';
import { FC } from 'react';

import { InputMessageStyles } from '../../models/message';
import { StatusMessages } from '../../types/texts';
import InputForAsk from '../InputForAsk/InputForAsk';

export interface ConversationInputProps {
  conversationViewState?: CustomViewState;
  isAgentAvailable: boolean;
  statusMessages: StatusMessages;
  isStreaming: boolean;
  isLastMessageFailed: boolean;
  regenerateLastMessage?: (() => Promise<void>) | undefined;
  inputMessageStyles: InputMessageStyles;
  askAnythingTitle?: string;
  onSendMessage: (message: string) => void;
  onStopStreaming: () => void;
}

export const ConversationInput: FC<ConversationInputProps> = ({
  conversationViewState,
  isAgentAvailable,
  statusMessages,
  isStreaming,
  isLastMessageFailed,
  regenerateLastMessage,
  inputMessageStyles,
  askAnythingTitle,
  onSendMessage,
  onStopStreaming,
}) => {
  if (
    conversationViewState?.errorContext?.kind ===
      ERROR_CONTEXT_KIND.RATE_LIMIT &&
    isRateLimitStillActive(conversationViewState.errorContext)
  ) {
    const restoreDate = getRateLimitRestoreDate(
      conversationViewState.errorContext,
    );

    if (restoreDate) {
      const restoreDateTime = formatDateTime(restoreDate);

      return (
        <InlineAlert type={InlineAlertType.Info}>
          {statusMessages.getAssistantRestoreMessage(
            restoreDateTime.date,
            restoreDateTime.time,
          )}
        </InlineAlert>
      );
    }
  }

  if (!isAgentAvailable) {
    return (
      <InlineAlert type={InlineAlertType.Error}>
        {statusMessages.assistantUnavailable}
      </InlineAlert>
    );
  }

  return (
    <InputForAsk
      onSendMessage={onSendMessage}
      onStopStreaming={onStopStreaming}
      inProcess={isStreaming}
      sendMessageIcon={inputMessageStyles.sendMessageIcon}
      retryIcon={inputMessageStyles.retryIcon}
      placeholder={askAnythingTitle ?? 'Ask anything...'}
      containerClasses="mt-4"
      inputClasses="border-neutrals-600 mr-2"
      isLastFailed={isLastMessageFailed}
      onRetryFailed={regenerateLastMessage}
    />
  );
};
