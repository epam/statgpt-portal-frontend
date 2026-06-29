'use client';

import { Conversation } from '@epam/ai-dial-shared';
import {
  CustomFields,
  ErrorContextBase,
  Message,
  streamChatResponse,
} from '@epam/statgpt-dial-toolkit';
import {
  HTTP_ERROR_CODES,
  HttpError,
  isHttpError,
} from '@epam/statgpt-shared-toolkit';
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useMemo,
  useState,
} from 'react';

import { ABORT_ERROR } from '../../../constants/errors';
import { StatusMessages } from '../../../types/texts';
import { updateConversationErrorContext } from '../../../utils/conversation';
import {
  resolveHttpStreamingError,
  throwIfMessageError,
} from '../../../utils/errors';
import { extractPartialMessageData } from '../../../utils/extract-partial-message';
import { getTimezone } from '../../../utils/timezone';
import {
  transformEditMessage,
  transformMessagesForApi,
  transformRegenerateMessage,
} from '../../../utils/transform-message-api';
import { validateAndPrepareMessage } from '../../../utils/validate-message';

// A user-initiated stop aborts the request, which surfaces as an AbortError.
// That is a normal outcome (not a failure), so callers branch on it to keep the
// partial response instead of rolling the message back.
const isStoppedStreaming = (error?: Error) => {
  return error?.name === ABORT_ERROR;
};

export interface UseConversationStreamingArgs {
  conversation: Conversation | null;
  setConversation: Dispatch<SetStateAction<Conversation | null>>;
  saveConversation: (conversation: Conversation) => Promise<void>;
  updateAssistantMessage: (
    assistantMessage: Message,
    partialMessage: Partial<Message>,
  ) => Message | undefined;
  addUserMessageToConversation: (userMessage: Message) => void;
  initializeAssistantMessage: () => Message;
  isStreaming: boolean;
  setIsStreaming: (isStreaming: boolean) => void;
  statusMessages: StatusMessages;
  isCrossDatasetModeOn: boolean;
  token?: string | null;
  handleInvalidStreaming?: (error: HttpError) => void;
}

/**
 * The SSE streaming engine: starting/aborting a stream, merging partials,
 * mapping transport errors to user-facing messages, persisting the finalized
 * conversation, and the send / regenerate / edit entry points. Decoupled from
 * the `conversation` prop for its core flow — every entry point receives the
 * conversation as an explicit `data` argument; the prop is only read to derive
 * the "retry last failed message" affordance.
 */
export const useConversationStreaming = ({
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
}: UseConversationStreamingArgs) => {
  const [conversationSignal, setConversationSignal] =
    useState<AbortController | null>(null);

  const handleStreamingError = useCallback(
    (
      error: any,
      assistantMessage?: Message,
    ): { assistantMessage?: Message; errorContext?: ErrorContextBase } => {
      let finalErrorMessage = statusMessages.serverError;
      let errorContext: ErrorContextBase | undefined;
      let httpError;

      if (isHttpError(error)) {
        httpError = error;

        const processedError = resolveHttpStreamingError({
          error,
          statusMessages,
        });

        finalErrorMessage = processedError.errorMessage;
        errorContext = processedError.errorContext;
      } else {
        httpError = new HttpError({
          status: HTTP_ERROR_CODES.INTERNAL_SERVER_ERROR,
          message: finalErrorMessage,
        });
      }

      if (assistantMessage) {
        assistantMessage = updateAssistantMessage(assistantMessage, {
          errorMessage: finalErrorMessage,
        });
      }

      handleInvalidStreaming?.(httpError);

      return { assistantMessage, errorContext };
    },
    [handleInvalidStreaming, statusMessages, updateAssistantMessage],
  );

  const handleStreamingResponse = useCallback(
    async (
      assistantMessage: Message,
      apiMessages: Message[],
      conversation?: Conversation & CustomFields,
    ): Promise<{
      assistantMessage?: Message;
      errorContext?: ErrorContextBase;
    }> => {
      const abortController = new AbortController();
      setConversationSignal(abortController);
      let currentAssistantMessage: Message | undefined = assistantMessage;
      let currentErrorContext: ErrorContextBase | undefined;

      if (!conversation) {
        return {
          assistantMessage: currentAssistantMessage,
          errorContext: currentErrorContext,
        };
      }

      const existingConvCustomFields =
        (conversation.custom_fields as CustomFields['custom_fields']) ?? {};

      const requestCustomFields: CustomFields['custom_fields'] = {
        ...existingConvCustomFields,
        configuration: {
          ...existingConvCustomFields.configuration,
          timezone: getTimezone(),
          ...(isCrossDatasetModeOn && { merge_python_code: true }),
        },
      };

      await streamChatResponse?.(
        encodeURI(conversation.id),
        apiMessages,
        {
          model: conversation.model,
          signal: abortController?.signal,
          onMessage: (data) => {
            throwIfMessageError({ error: data.error, statusMessages });

            const partialMessage = extractPartialMessageData(data);

            if (
              partialMessage.content ||
              partialMessage.role ||
              partialMessage.responseId
            ) {
              currentAssistantMessage = updateAssistantMessage(
                currentAssistantMessage as Message,
                partialMessage,
              );
            }
          },
          onError: (error) => {
            if (!isStoppedStreaming(error)) {
              console.error('Streaming error:', error);
              throw error;
            }
          },
        },
        token,
        requestCustomFields,
      ).catch((error) => {
        if (!isStoppedStreaming(error)) {
          const { assistantMessage, errorContext } = handleStreamingError(
            error,
            currentAssistantMessage,
          );
          currentAssistantMessage = assistantMessage;
          currentErrorContext = errorContext;
        }
      });

      return {
        assistantMessage: currentAssistantMessage,
        errorContext: currentErrorContext,
      };
    },
    [
      token,
      updateAssistantMessage,
      handleStreamingError,
      statusMessages,
      isCrossDatasetModeOn,
    ],
  );

  const finalizeConversation = useCallback(
    async (
      assistantMessage: Message,
      conversation: Conversation,
      userMessage?: Message,
      errorContext?: ErrorContextBase,
    ) => {
      if (!conversation) return;

      let updatedConversation = updateConversationErrorContext(
        conversation,
        errorContext,
      );

      updatedConversation = {
        ...updatedConversation,
        messages: [...conversation.messages],
        updatedAt: Date.now(),
      };

      if (userMessage) {
        updatedConversation.messages.push(userMessage);
      }

      updatedConversation.messages.push(assistantMessage);

      await saveConversation(updatedConversation);
    },
    [saveConversation],
  );

  const setConversationErrorContext = useCallback(
    (context?: ErrorContextBase) => {
      setConversation((conversation) => {
        if (!conversation) return conversation;

        return updateConversationErrorContext(conversation, context);
      });
    },
    [setConversation],
  );

  const handleSendMessageError = useCallback(
    (_error: unknown, userMessage: Message) => {
      setConversation((prev) =>
        prev
          ? {
              ...prev,
              messages: (prev.messages as Message[]).filter(
                (msg) => msg.id !== userMessage.id,
              ),
            }
          : null,
      );
    },
    [setConversation],
  );

  const onStopStreaming = useCallback(() => {
    if (conversationSignal && !conversationSignal.signal.aborted) {
      conversationSignal.abort();
    }
  }, [conversationSignal]);

  const handleStreamingProcessError = useCallback(
    async (
      conversation: Conversation,
      userMessage: Message,
      initialAssistantMessage?: Message,
      finalAssistantMessage?: Message,
      error?: Error,
      isSaveUserMessage = true,
    ) => {
      if (isStoppedStreaming(error)) {
        await finalizeConversation(
          (finalAssistantMessage ?? initialAssistantMessage) as Message,
          conversation,
          isSaveUserMessage ? userMessage : void 0,
        );
      } else {
        handleSendMessageError(error, userMessage);
      }
    },
    [finalizeConversation, handleSendMessageError],
  );

  const sendMessageToConversation = useCallback(
    async (
      content: string,
      data: Conversation | null,
      customChoiceId?: string,
    ) => {
      if (!data || !content) {
        return;
      }
      const userMessage = validateAndPrepareMessage(
        content,
        isStreaming,
        data,
        customChoiceId,
      );
      let initialAssistantMessage, finalAssistantMessage;

      if (!userMessage) return;

      addUserMessageToConversation(userMessage);

      try {
        setIsStreaming(true);

        initialAssistantMessage = initializeAssistantMessage();
        const apiMessages = transformMessagesForApi(userMessage, data);

        const { assistantMessage, errorContext } =
          await handleStreamingResponse(
            initialAssistantMessage,
            apiMessages,
            data,
          );

        setConversationErrorContext(errorContext);

        finalAssistantMessage = assistantMessage;

        await finalizeConversation(
          finalAssistantMessage as Message,
          data,
          userMessage,
          errorContext,
        );
      } catch (err) {
        handleStreamingProcessError(
          data,
          userMessage,
          initialAssistantMessage,
          finalAssistantMessage,
          err as Error,
        );
      } finally {
        setIsStreaming(false);
      }
    },
    [
      isStreaming,
      setIsStreaming,
      addUserMessageToConversation,
      initializeAssistantMessage,
      handleStreamingResponse,
      finalizeConversation,
      handleStreamingProcessError,
      setConversationErrorContext,
    ],
  );

  const processMessageRequest = useCallback(
    async (
      apiMessages: Message[],
      updatedConversation: Conversation,
      message: Message,
    ) => {
      let initialAssistantMessage, finalAssistantMessage;

      try {
        setIsStreaming(true);
        initialAssistantMessage = initializeAssistantMessage();
        const { assistantMessage, errorContext } =
          await handleStreamingResponse(
            initialAssistantMessage,
            apiMessages,
            updatedConversation,
          );
        finalAssistantMessage = assistantMessage;

        setConversationErrorContext(errorContext);

        await finalizeConversation(
          finalAssistantMessage as Message,
          updatedConversation,
          undefined,
          errorContext,
        );
      } catch (err) {
        handleStreamingProcessError(
          updatedConversation,
          message,
          initialAssistantMessage,
          finalAssistantMessage,
          err as Error,
          false,
        );
      } finally {
        setIsStreaming(false);
      }
    },
    [
      setIsStreaming,
      finalizeConversation,
      handleStreamingProcessError,
      handleStreamingResponse,
      initializeAssistantMessage,
      setConversationErrorContext,
    ],
  );

  const regenerateMessage = useCallback(
    async (message: Message, data: Conversation | null) => {
      if (!data || !message) {
        return;
      }

      const apiMessages = transformRegenerateMessage(message, data);
      const updatedConversation = {
        ...data,
        messages: data.messages.slice(0, apiMessages.length),
      };
      setConversation((prev) =>
        prev
          ? {
              ...prev,
              ...updatedConversation,
            }
          : null,
      );

      processMessageRequest(apiMessages, updatedConversation, message);
    },
    [setConversation, processMessageRequest],
  );

  const editMessage = useCallback(
    async (message: Message, data: Conversation | null) => {
      if (!data || !message) {
        return;
      }

      const apiMessages = transformEditMessage(message, data);
      const updatedConversation = {
        ...data,
        messages: [...data.messages.slice(0, apiMessages.length - 1), message],
      };
      setConversation((prev) =>
        prev
          ? {
              ...prev,
              ...updatedConversation,
            }
          : null,
      );
      processMessageRequest(apiMessages, updatedConversation, message);
    },
    [setConversation, processMessageRequest],
  );

  const { isLastMessageFailed, regenerateLastMessage } = useMemo(() => {
    const lastMessage = conversation?.messages?.at(-1);
    const isLastMessageFailed = !!lastMessage?.errorMessage;
    const regenerateLastMessage =
      lastMessage && (() => regenerateMessage(lastMessage, conversation));

    return { isLastMessageFailed, regenerateLastMessage };
  }, [conversation, regenerateMessage]);

  return {
    sendMessageToConversation,
    regenerateMessage,
    editMessage,
    onStopStreaming,
    isLastMessageFailed,
    regenerateLastMessage,
  };
};
