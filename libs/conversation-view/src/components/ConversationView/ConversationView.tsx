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
  CustomFields,
  mergeMessages,
  Message,
  streamChatResponse,
} from '@epam/statgpt-dial-toolkit';
import {
  cleanConversationNames,
  DataQuery,
  FormatNumbersType,
  useAgentAvailability,
} from '@epam/statgpt-shared-toolkit';
import {
  Button,
  Loader,
  LimitMessages,
  InlineAlert,
  InlineAlertVariant,
} from '@epam/statgpt-ui-components';
import { MetadataSettings } from '../../models/metadata';
import { ConversationViewTitles } from '../../models/titles';
import { getRedirectConversationPath } from '../../utils/get-conversation-path';
import { generateConversation } from '../../utils/generate-conversation';

import { ABORT_ERROR } from '../../constants/errors';
import { useOnboarding } from '../../context/OnboardingContext';
import { useChatMessages } from '../../context/ChatMessagesContext';
import { OnboardingElements } from '../../constants/onboarding-elements';
import { getOnboardingInfoForAdvancedView } from '../../utils/get-tooltip-data.by-element';
import { AttachmentsConfig } from '../../models/attachments';
import { merge } from 'lodash';

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
  handleInvalidStreaming?: (error: string) => void;
  messageActionsIcons?: MessageActionIcons;
  editMessageTitles: EditMessageTitles;
  scrollBottomIcon?: ReactNode;
  isFinalMessage?: boolean;
  limitMessages: LimitMessages;
  attachmentsConfig?: AttachmentsConfig;
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
}) => {
  const [conversationSignal, setConversationSignal] =
    useState<AbortController | null>(null);
  const [isReadonlyConversation, setIsReadonlyConversation] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { isStreaming, setIsStreaming } = useChatMessages();
  const { isOpenedAdvancedView } = useAdvancedView();

  const { isAgentAvailable } = useAgentAvailability();

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
      const newConversation = generateConversation(
        conversation as Conversation,
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

  const handleStreamingResponse = useCallback(
    async (
      assistantMessage: Message,
      apiMessages: Message[],
      conversation?: Conversation & CustomFields,
    ) => {
      const abortController = new AbortController();
      setConversationSignal(abortController);
      let currentAssistantMessage: Message | undefined = assistantMessage;
      if (!conversation) {
        return;
      }

      await streamChatResponse?.(
        encodeURI(conversation.id),
        apiMessages,
        {
          model: conversation.model,
          signal: abortController?.signal,
          onMessage: (data) => {
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
        const message = error.message;
        handleInvalidStreaming?.(message);
      });

      return currentAssistantMessage;
    },
    [updateAssistantMessage, handleInvalidStreaming, token],
  );

  const finalizeConversation = useCallback(
    async (
      assistantMessage: Message,
      conversation: Conversation,
      userMessage?: Message,
    ) => {
      if (conversation) {
        const updatedConversation = {
          ...conversation,
          messages: [...conversation.messages],
          updatedAt: Date.now(),
        };

        if (userMessage) {
          updatedConversation.messages.push(userMessage);
        }

        updatedConversation.messages.push(assistantMessage);

        await saveConversation(updatedConversation);
      }
    },
    [saveConversation],
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

        finalAssistantMessage = await handleStreamingResponse(
          initialAssistantMessage,
          apiMessages,
          data,
        );

        await finalizeConversation(
          finalAssistantMessage as Message,
          data,
          userMessage,
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
        finalAssistantMessage = await handleStreamingResponse(
          initialAssistantMessage,
          apiMessages,
          updatedConversation,
        );

        await finalizeConversation(
          finalAssistantMessage as Message,
          updatedConversation,
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

  useEffect(() => {
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

  const getInput = () => {
    if (!isAgentAvailable) {
      return (
        <InlineAlert variant={InlineAlertVariant.Error}>
          The AI Assistant is unavailable. To gain access, please contact
          Support.
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
        placeholder={titles?.askAnything ?? 'Ask anything...'}
        containerClasses="mt-4"
        inputClasses="border-neutrals-600 mr-2"
      />
    );
  };

  return (
    <div
      className={classNames(
        'h-full flex flex-col bg-white',
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
      <div
        className={classNames(
          'flex-1 min-h-0 flex flex-col items-end overflow-y-auto',
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
          editMessage={(message: Message) => editMessage(message, conversation)}
          editMessageTitles={editMessageTitles}
          scrollBottomIcon={scrollBottomIcon}
          isReadOnlyConversation={isReadonlyConversation || isShowOnboarding}
          limitMessages={limitMessages}
          attachmentsConfig={attachmentsConfig}
        />
      </div>
      {isShowOnboarding ? null : !isReadonlyConversation ? (
        <div className={classNames(inputMessageStyles.inputContainerClass)}>
          {getInput()}
        </div>
      ) : (
        <div className="flex items-center justify-center mt-4">
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
    </div>
  );
};
