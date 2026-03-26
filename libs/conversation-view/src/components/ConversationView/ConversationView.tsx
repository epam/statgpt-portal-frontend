/**
 * ConversationView - Interactive chat conversation component
 *
 * A comprehensive React component for displaying and managing chat conversations.
 * Features include real-time message streaming, conversation persistence,
 * customizable UI rendering through render props, and full conversation
 * lifecycle management (loading, sending, error handling).
 */

'use client';

import {
  Conversation,
  ConversationInfo,
  LikeState,
  Role,
} from '@epam/ai-dial-shared';
import classNames from 'classnames';
import {
  Dispatch,
  FC,
  ReactNode,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { IconCopy, IconPlus } from '@tabler/icons-react';

import ChatMessages from '../ChatMessages/ChatMessages';
import ConversationViewHeader from '../ConversationViewHeader/ConversationViewHeader';
import InputForAsk from '../InputForAsk/InputForAsk';
import { useAdvancedView } from '../../context/AdvancedViewContext';
import { ConversationViewActions } from '../../models/actions';
import { AttachmentsStyles } from '../../models/attachments-styles';
import {
  EditMessageTitles,
  InputMessageStyles,
  MessageActionIcons,
  MessageStyles,
} from '../../models/message';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { ShareConversationProps } from '@statgpt/share-conversation/src/models/share-conversation';
import { extractPartialMessageData } from '../../utils/extract-partial-message';
import {
  isConversationIdExternal,
  isReadOnlyConversation,
} from '../../utils/is-read-only-conversation';
import {
  transformEditMessage,
  transformMessagesForApi,
  transformRegenerateMessage,
} from '../../utils/transform-message-api';
import { validateAndPrepareMessage } from '../../utils/validate-message';

import {
  CUSTOM_VIEW_STATE_KEY,
  CustomFields,
  CustomViewState,
  ERROR_CONTEXT_KIND,
  ErrorContextBase,
  formatDateTime,
  getRateLimitRestoreDate,
  isRateLimitStillActive,
  mergeMessages,
  Message,
  streamChatResponse,
} from '@epam/statgpt-dial-toolkit';
import {
  cleanConversationNames,
  DataQuery,
  FormatNumbersType,
  HTTP_ERROR_CODES,
  HttpError,
  isHttpError,
} from '@epam/statgpt-shared-toolkit';
import {
  Button,
  Loader,
  LimitMessages,
  InlineAlert,
  InlineAlertType,
  useAgentAvailability,
} from '@epam/statgpt-ui-components';
import { MetadataSettings } from '../../models/metadata';
import { ConversationViewTitles } from '../../models/titles';
import { ConversationViewTitlesProvider } from '../../context/ConversationViewTitlesContext';
import { getRedirectConversationPath } from '../../utils/get-conversation-path';
import { generateConversation } from '../../utils/generate-conversation';
import { duplicateConversationAttachments } from '../../utils/duplicate-conversation-attachments';

import { ABORT_ERROR } from '../../constants/errors';
import { useOnboarding } from '../../context/OnboardingContext';
import { useChatMessages } from '../../context/ChatMessagesContext';
import { OnboardingElements } from '../../constants/onboarding-elements';
import { getOnboardingInfoForAdvancedView } from '../../utils/get-tooltip-data.by-element';
import { AttachmentsConfig } from '../../models/attachments';
import { merge } from 'lodash';
import { useConversationViewMessages } from '../../context/ConversationViewMessagesContext';
import {
  resolveHttpStreamingError,
  throwIfMessageError,
} from '../../utils/errors';
import { updateConversationErrorContext } from '../../utils/conversation';
import { clearRequestCache } from '../../utils/request-cache';
import { ConversationViewSidePanelOutlet } from './SidePanel/ConversationViewSidePanelContext';

interface Props {
  conversationKey: string;
  conversation: Conversation | null;
  actions: ConversationViewActions;
  messageStyles?: MessageStyles;
  attachmentsStyles?: AttachmentsStyles;
  inputMessageStyles: InputMessageStyles;
  shareConversationProps?: ShareConversationProps;
  showConversationHeaderAdvancedView?: boolean;
  formattingSettings?: FormatNumbersType;
  metadataSettings?: MetadataSettings;
  titles?: ConversationViewTitles;
  expandStagesIcon?: ReactNode;
  locale: string;
  conversationsRoute?: string;
  token?: string | null;
  dataQuery?: DataQuery;
  signOutTitle?: string;
  setConversation: Dispatch<SetStateAction<Conversation | null>>;
  setConversations: (conversations: ConversationInfo[]) => void;
  openUrl: (url: string) => void;
  signOutAction?: () => void;
  handleInvalidStreaming?: (error: HttpError) => void;
  messageActionsIcons?: MessageActionIcons;
  editMessageTitles: EditMessageTitles;
  scrollBottomIcon?: ReactNode;
  isFinalMessage?: boolean;
  limitMessages: LimitMessages;
  attachmentsConfig?: AttachmentsConfig;
  children?: ReactNode;
}

export const ConversationView: FC<Props> = ({
  conversationKey,
  conversation,
  actions,
  messageStyles,
  attachmentsStyles,
  inputMessageStyles,
  shareConversationProps,
  showConversationHeaderAdvancedView = true,
  formattingSettings,
  metadataSettings,
  expandStagesIcon,
  locale,
  conversationsRoute,
  token,
  titles,
  dataQuery,
  handleInvalidStreaming,
  setConversation,
  setConversations,
  openUrl,
  messageActionsIcons,
  editMessageTitles,
  scrollBottomIcon,
  isFinalMessage,
  limitMessages,
  attachmentsConfig,
  children,
}) => {
  const [conversationSignal, setConversationSignal] =
    useState<AbortController | null>(null);
  const [isReadonlyConversation, setIsReadonlyConversation] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { isStreaming, setIsStreaming } = useChatMessages();
  const { isOpenedAdvancedView } = useAdvancedView();

  const { isAgentAvailable } = useAgentAvailability();
  const { statusMessages } = useConversationViewMessages();

  const {
    onboardingFileSchema,
    onboardingFilePath,
    onboardingFileName,
    isShowOnboarding,
    setOnboardingFileSchema,
  } = useOnboarding();

  useEffect(() => {
    if (onboardingFileSchema) {
      actions.putOnboardingFile?.(
        onboardingFileName,
        onboardingFilePath,
        onboardingFileSchema,
      );
    }
  }, [actions, onboardingFileSchema, onboardingFileName, onboardingFilePath]);

  useEffect(() => {
    // if user open advanced view (while attachment is loading) -> skip tooltip for opening
    if (
      isOpenedAdvancedView &&
      onboardingFileSchema?.lastDisplayedElement ===
        OnboardingElements.OPEN_ADVANCED_VIEW
    ) {
      setOnboardingFileSchema?.(
        getOnboardingInfoForAdvancedView(onboardingFileSchema),
      );
    }
  }, [
    actions,
    isOpenedAdvancedView,
    setOnboardingFileSchema,
    onboardingFileSchema,
  ]);

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
        conversation?.custom_fields as CustomFields,
      ).catch((error) => {
        const { assistantMessage, errorContext } = handleStreamingError(
          error,
          currentAssistantMessage,
        );
        currentAssistantMessage = assistantMessage;
        currentErrorContext = errorContext;
      });

      return {
        assistantMessage: currentAssistantMessage,
        errorContext: currentErrorContext,
      };
    },
    [token, updateAssistantMessage, handleStreamingError, statusMessages],
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
    (error: unknown, userMessage: Message) => {
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

  const isStoppedStreaming = (error?: Error) => {
    return error?.name === ABORT_ERROR;
  };

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

  const { isLastMessageFailed, regenerateLastMessage } = useMemo(() => {
    const lastMessage = conversation?.messages?.at(-1);
    const isLastMessageFailed = !!lastMessage?.errorMessage;
    const regenerateLastMessage =
      lastMessage && (() => regenerateMessage(lastMessage, conversation));

    return { isLastMessageFailed, regenerateLastMessage };
  }, [conversation, regenerateMessage]);

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

  useEffect(() => {
    clearRequestCache();

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

  if (isLoading) {
    return <Loader />;
  }

  const conversationViewState = conversation?.customViewState?.[
    CUSTOM_VIEW_STATE_KEY
  ] as CustomViewState | undefined;

  const getInput = () => {
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
        onSendMessage={(message) =>
          sendMessageToConversation(message, conversation)
        }
        onStopStreaming={onStopStreaming}
        inProcess={isStreaming}
        sendMessageIcon={inputMessageStyles.sendMessageIcon}
        retryIcon={inputMessageStyles.retryIcon}
        placeholder={titles?.askAnything ?? 'Ask anything...'}
        containerClasses="mt-4"
        inputClasses="border-neutrals-600 mr-2"
        isLastFailed={isLastMessageFailed}
        onRetryFailed={regenerateLastMessage}
      />
    );
  };

  return (
    <ConversationViewTitlesProvider titles={titles}>
      <div
        className={classNames(
          'h-full flex flex-col bg-white conversation-view-wrapper',
          isOpenedAdvancedView && !showConversationHeaderAdvancedView
            ? 'p-4'
            : 'pr-2',
        )}
      >
        {isOpenedAdvancedView && !showConversationHeaderAdvancedView ? null : (
          <ConversationViewHeader
            conversation={conversation}
            locale={locale}
            isOpenedAdvancedView={isOpenedAdvancedView}
            isShowShareButton={!isReadonlyConversation && !isShowOnboarding}
            shareConversationProps={shareConversationProps}
          />
        )}
        <div className="flex min-h-0 w-full flex-1">
          <div className="flex min-h-0 flex-1 flex-col">
            <div
              className={classNames(
                'flex-1 min-h-0 flex flex-col items-end scroll-hidden-container',
                messageStyles?.messagesWrapperClass,
              )}
            >
              <ChatMessages
                messages={conversation?.messages || []}
                actions={messageServerActions}
                isStreaming={isStreaming}
                isReadOnly={isReadonlyConversation}
                messageStyles={messageStyles}
                attachmentsStyles={attachmentsStyles}
                formattingSettings={formattingSettings}
                metadataSettings={metadataSettings}
                expandStagesIcon={expandStagesIcon}
                dataQuery={dataQuery}
                locale={locale}
                titles={titles}
                regenerateMessage={(message: Message) =>
                  regenerateMessage(message, conversation)
                }
                selectMessageToSend={(message, choiceId) =>
                  sendMessageToConversation(
                    message as string,
                    conversation,
                    choiceId as string,
                  )
                }
                messageActionsIcons={messageActionsIcons}
                rateResponse={rateResponse}
                editMessage={(message: Message) =>
                  editMessage(message, conversation)
                }
                editMessageTitles={editMessageTitles}
                scrollBottomIcon={scrollBottomIcon}
                isReadOnlyConversation={
                  isReadonlyConversation || isShowOnboarding
                }
                limitMessages={limitMessages}
                attachmentsConfig={attachmentsConfig}
                conversationViewState={conversationViewState}
              />
            </div>
            {isShowOnboarding ? null : !isReadonlyConversation ? (
              <div
                className={classNames(inputMessageStyles.inputContainerClass)}
              >
                {getInput()}
              </div>
            ) : (
              <div className="mt-4 flex items-center justify-center">
                <Button
                  iconBefore={<IconCopy width={20} height={20} />}
                  title={titles?.duplicate ?? 'Duplicate Chat'}
                  isSmallButton={true}
                  onClick={duplicateConversation}
                  buttonClassName={classNames('text-button-secondary')}
                />
              </div>
            )}
            {isShowOnboarding && isFinalMessage && (
              <Button
                iconBefore={<IconPlus width={24} height={24} />}
                title={titles?.onboardingFooterLink}
                onClick={handleOpeningOfNewConversation}
                isSmallButton={true}
                buttonClassName="text-button-secondary self-center mb-3"
              />
            )}
            {children}
          </div>
          {!isOpenedAdvancedView && (
            <ConversationViewSidePanelOutlet scope="conversation" />
          )}
        </div>
      </div>
    </ConversationViewTitlesProvider>
  );
};
