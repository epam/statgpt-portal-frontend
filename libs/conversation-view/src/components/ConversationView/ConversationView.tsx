/**
 * ConversationView - Interactive chat conversation component
 *
 * A comprehensive React component for displaying and managing chat conversations.
 * Features include real-time message streaming, conversation persistence,
 * customizable UI rendering through render props, and full conversation
 * lifecycle management (loading, sending, error handling).
 */

'use client';

import { Conversation, ConversationInfo, Role } from '@epam/ai-dial-shared';
import classNames from 'classnames';
import {
  FC,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import { IconCopy } from '@tabler/icons-react';

import ChatMessages from '@statgpt/conversation-view/src/components/ChatMessages/ChatMessages';
import ConversationViewHeader from '@statgpt/conversation-view/src/components/ConversationViewHeader/ConversationViewHeader';
import InputForAsk from '@statgpt/conversation-view/src/components/InputForAsk/InputForAsk';
import { useAdvancedView } from '@statgpt/conversation-view/src/context/AdvancedViewContext';
import { ConversationViewActions } from '@statgpt/conversation-view/src/models/actions';
import { AttachmentsStyles } from '@statgpt/conversation-view/src/models/attachments-styles';
import {
  InputMessageStyles,
  MessageStyles,
} from '@statgpt/conversation-view/src/models/message';
import { ShareConversationProps } from '@statgpt/conversation-view/src/models/share-conversation';
import { extractPartialMessageData } from '@statgpt/conversation-view/src/utils/extract-partial-message';
import {
  isConversationIdExternal,
  isReadOnlyConversation,
} from '@statgpt/conversation-view/src/utils/is-read-only-conversation';
import { transformMessagesForApi } from '@statgpt/conversation-view/src/utils/transform-message-api';
import { validateAndPrepareMessage } from '@statgpt/conversation-view/src/utils/validate-message';
import { streamChatResponse } from '@statgpt/dial-toolkit/src/api/chat-streaming-api';
import { Message } from '@statgpt/dial-toolkit/src/models/message';
import { mergeMessages } from '@statgpt/dial-toolkit/src/utils/merge-messages';
import { FormatNumbersType } from '@statgpt/shared-toolkit/src/models/format-numbers-type';
import { Button } from '@statgpt/ui-components/src/components/Button/Button';
import { Loader } from '@statgpt/ui-components/src/components/Loader/Loader';
import { MetadataSettings } from '@statgpt/conversation-view/src/models/metadata';
import { ConversationViewTitles } from '@statgpt/conversation-view/src/models/titles';
import { ConversationDetails } from '@statgpt/conversation-view/src/models/conversation';
import {
  getConversationPath,
  getRedirectConversationPath,
} from '@statgpt/conversation-view/src/utils/get-conversation-path';
import { generateConversation } from '@statgpt/conversation-view/src/utils/generate-conversation';
import { cleanConversationNames } from '@statgpt/conversation-list/src/utils/conversation-mapping';

interface Props {
  conversationDetails: ConversationDetails;
  actions: ConversationViewActions;
  messageStyles?: MessageStyles;
  attachmentsStyles?: AttachmentsStyles;
  inputMessageStyles: InputMessageStyles;
  shareConversationProps?: ShareConversationProps;
  showAdvancedView?: boolean;
  showConversationHeaderAdvancedView?: boolean;
  formattingSettings?: FormatNumbersType;
  metadataSettings?: MetadataSettings;
  titles?: ConversationViewTitles;
  expandStagesIcon?: ReactNode;
  locale: string;
  conversationsRoute?: string;
  token?: string | null;
  setConversations: (conversations: ConversationInfo[]) => void;
}

const ConversationView: FC<Props> = ({
  conversationDetails,
  actions,
  messageStyles,
  attachmentsStyles,
  inputMessageStyles,
  shareConversationProps,
  showAdvancedView = false,
  showConversationHeaderAdvancedView = true,
  formattingSettings,
  metadataSettings,
  expandStagesIcon,
  locale,
  conversationsRoute,
  token,
  titles,
  setConversations,
}) => {
  const router = useRouter();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [conversationSignal, setConversationSignal] =
    useState<AbortController | null>(null);
  const [isReadonlyConversation, setIsReadonlyConversation] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const { isOpenedAdvancedView } = useAdvancedView();

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

      router.push(
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
    router,
    setConversations,
  ]);

  const saveConversation = useCallback(
    async (updatedConversation: Conversation) => {
      try {
        await actions.updateConversation(
          decodeURI(getConversationPath(conversationDetails)),
          {
            name: updatedConversation.name,
            messages: updatedConversation.messages,
          },
        );
      } catch (err) {
        console.error('Failed to save conversation:', err);
      }
    },
    [actions, conversationDetails],
  );

  const addUserMessageToConversation = useCallback((userMessage: Message) => {
    setConversation((prev) =>
      prev
        ? {
            ...prev,
            messages: [...(prev?.messages || []), userMessage],
          }
        : null,
    );
  }, []);

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
  }, []);

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
    [],
  );

  const handleStreamingResponse = useCallback(
    async (
      assistantMessage: Message,
      apiMessages: Message[],
      conversation?: Conversation,
    ) => {
      setConversationSignal(new AbortController());
      let currentAssistantMessage: Message | undefined = assistantMessage;
      if (!conversation) {
        return;
      }

      await streamChatResponse?.(
        encodeURI(conversation.id),
        apiMessages,
        {
          model: conversation.model,
          signal: conversationSignal?.signal,
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
            console.error('Streaming error:', error);
            throw error;
          },
        },
        token,
      );

      return currentAssistantMessage;
    },
    [updateAssistantMessage, conversationSignal, token],
  );

  const finalizeConversation = useCallback(
    async (
      userMessage: Message,
      assistantMessage: Message,
      conversation: Conversation,
    ) => {
      if (conversation) {
        const updatedConversation = {
          ...conversation,
          messages: [...conversation.messages, userMessage, assistantMessage],
          updatedAt: Date.now(),
        };
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
    [],
  );

  const onStopStreaming = useCallback(() => {
    if (conversationSignal && !conversationSignal.signal.aborted) {
      conversationSignal.abort();
    }
  }, [conversationSignal]);

  const sendMessageToConversation = useCallback(
    async (content: string, data: Conversation | null) => {
      if (!data || !content) {
        return;
      }
      const userMessage = validateAndPrepareMessage(content, isStreaming, data);
      if (!userMessage) return;

      addUserMessageToConversation(userMessage);

      try {
        setIsStreaming(true);

        const assistantMessage = initializeAssistantMessage();
        const apiMessages = transformMessagesForApi(userMessage, data);

        const finalAssistantMessage = await handleStreamingResponse(
          assistantMessage,
          apiMessages,
          data,
        );

        await finalizeConversation(
          userMessage,
          finalAssistantMessage as Message,
          data,
        );
      } catch (err) {
        handleSendMessageError(err, userMessage);
      } finally {
        setIsStreaming(false);
      }
    },
    [
      addUserMessageToConversation,
      handleSendMessageError,
      finalizeConversation,
      handleStreamingResponse,
      initializeAssistantMessage,
      isStreaming,
    ],
  );

  useEffect(() => {
    async function fetchConversationById() {
      try {
        setIsLoading(true);
        const { bucket } = await actions.getBucket();
        const conversationPath = getConversationPath(
          conversationDetails,
          bucket,
        );
        const data = await actions.getConversation(decodeURI(conversationPath));
        setConversation(data);
        setIsReadonlyConversation(
          isReadOnlyConversation(data) &&
            isConversationIdExternal(data, bucket),
        );
        if (data.messages.length === 0) {
          sendMessageToConversation(data.prompt, data);
        }
      } catch {
        setIsReadonlyConversation(true);
      } finally {
        setIsLoading(false);
      }
    }

    if (conversationDetails?.conversationId) {
      fetchConversationById();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationDetails?.conversationId]);

  const messageServerActions = useMemo(
    () => ({
      getFile: actions.getFile,
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
          messageStyles={messageStyles}
          attachmentsStyles={attachmentsStyles}
          showAdvancedView={showAdvancedView}
          formattingSettings={formattingSettings}
          metadataSettings={metadataSettings}
          expandStagesIcon={expandStagesIcon}
          locale={locale}
          titles={titles}
        />
      </div>
      {!isReadonlyConversation ? (
        <div className={classNames(inputMessageStyles.inputContainerClass)}>
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
    </div>
  );
};

export default ConversationView;
