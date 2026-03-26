'use client';

import {
  FormSchemaButtonOption,
  DialSchemaProperties,
  MessageFormSchema,
  ConversationInfo,
} from '@epam/ai-dial-shared';
import InputForAsk from '../InputForAsk/InputForAsk';
import { FC, ReactNode, useCallback, useEffect, useState } from 'react';
import classNames from 'classnames';
import {
  CreateConversationRequest,
  getSharedConversationsRequest,
  SharedConversationsRequest,
  SharedConversations,
  ShareTarget,
} from '@epam/statgpt-dial-toolkit';
import { cleanConversationNames } from '@epam/statgpt-shared-toolkit';
import {
  InlineAlert,
  InlineAlertType,
  Loader,
  useAgentAvailability,
  Tag,
} from '@epam/statgpt-ui-components';
import { transformSharedConversations } from '@epam/statgpt-conversation-list';
import { getCreateConversationRequest } from '../../utils/conversation-request';
import { generateOnboardingConversation } from '../../utils/generate-onboarding-conversation';
import { InputMessageStyles } from '../../models/message';
import { ConversationViewTitles } from '../../models/titles';
import { ConversationOnboarding } from '../ConversationOnboarding/ConversationOnboarding';
import { ChatOnboardingFooter } from '../ChatOnboardingFooter/ChatOnboardingFooter';
import { useOnboarding } from '../../context/OnboardingContext';
import { PutOnboardingFile } from '../../types/actions';
import { ChatFooter } from '../ChatFooter/ChatFooter';
import { useConversationViewMessages } from '../../context/ConversationViewMessagesContext';

interface ConversationListActions {
  getBucket: () => Promise<{ bucket: string }>;
  createConversation: (
    request: CreateConversationRequest,
    locale: string,
    isOnboardingConversation?: boolean,
  ) => Promise<ConversationInfo>;
  getConversations: (locale: string) => Promise<ConversationInfo[]>;
  getSharedConversations: (
    requestData?: SharedConversationsRequest,
  ) => Promise<SharedConversations>;
  putOnboardingFile?: PutOnboardingFile;
}

interface Props {
  locale: string;
  titles: ConversationViewTitles;
  suggestionsList: FormSchemaButtonOption[];
  welcomeText: string;
  titleIcon?: ReactNode;
  inputMessageStyles: InputMessageStyles;
  isBottomInputPosition?: boolean;
  actions: ConversationListActions;
  prompt?: string;
  onboardingMessageSchema?: MessageFormSchema;
  handleConversationClick: (folderId: string, conversationId: string) => void;
  setConversations: (conversations: ConversationInfo[]) => void;
  setSharedConversations: (sharedConversations: ConversationInfo[]) => void;
}

export const ConversationWelcome: FC<Props> = ({
  suggestionsList,
  welcomeText,
  titleIcon,
  actions,
  titles,
  inputMessageStyles,
  isBottomInputPosition,
  prompt,
  onboardingMessageSchema,
  handleConversationClick,
  setConversations,
  locale,
  setSharedConversations,
}) => {
  const [bucket, setBucket] = useState<string | null>(null);
  const [isBucketLoading, setIsBucketLoading] = useState(true);
  const [isCreatingConversation, setIsCreatingConversation] =
    useState<boolean>(false);
  const {
    onboardingFileSchema,
    onboardingFileName,
    onboardingFilePath,
    isShowOnboarding,
    setIsShowOnboarding,
    setOnboardingFileSchema,
  } = useOnboarding();

  const { isAgentAvailable } = useAgentAvailability();
  const { statusMessages } = useConversationViewMessages();

  useEffect(() => {
    const loadData = async () => {
      try {
        const bucketData = await actions.getBucket();
        setBucket(bucketData.bucket);
      } catch (err) {
        console.error(err instanceof Error ? err.message : 'Request error');
      } finally {
        setIsBucketLoading(false);
      }
    };

    loadData();
  }, [actions]);

  const createConversation = useCallback(
    async (message?: string, choiceId?: string) => {
      if (!bucket) {
        console.error('No bucket');
        return;
      }

      setIsCreatingConversation(true);

      try {
        const conversationRequestData = isShowOnboarding
          ? generateOnboardingConversation(
              bucket,
              locale,
              titles?.onboardingTitle ?? 'Introducing the AI assistant',
              onboardingMessageSchema?.properties?.choice?.description ?? '',
              message,
              choiceId,
            )
          : getCreateConversationRequest(
              bucket,
              locale,
              titles.newChat ?? 'New chat',
              message,
            );

        const newConversation = await actions.createConversation(
          conversationRequestData,
          locale,
          isShowOnboarding,
        );
        const conversationsData = await actions.getConversations(locale);
        const sharedConversationsData = await actions.getSharedConversations(
          getSharedConversationsRequest(ShareTarget.ME),
        );

        if (onboardingMessageSchema && onboardingFileSchema) {
          const updatedOnboardingFileSchema = {
            ...onboardingFileSchema,
            isStarted: true,
          };
          await actions.putOnboardingFile?.(
            onboardingFileName,
            onboardingFilePath,
            updatedOnboardingFileSchema,
          );
          setOnboardingFileSchema?.(updatedOnboardingFileSchema);
        }

        setConversations(cleanConversationNames(conversationsData));
        setSharedConversations(
          cleanConversationNames(
            transformSharedConversations(sharedConversationsData, locale),
          ),
        );
        handleConversationClick(newConversation.folderId, newConversation.id);
      } catch (err) {
        console.error(
          err instanceof Error ? err.message : 'Creation conversation failed',
        );
        setIsCreatingConversation(false);
      }
    },
    [
      actions,
      bucket,
      handleConversationClick,
      isShowOnboarding,
      locale,
      onboardingFileName,
      onboardingFilePath,
      onboardingFileSchema,
      onboardingMessageSchema,
      setConversations,
      setOnboardingFileSchema,
      setSharedConversations,
      titles.newChat,
      titles?.onboardingTitle,
    ],
  );

  const handleOnboardingSkip = useCallback(
    async (isSkippedOnboarding?: boolean) => {
      setIsShowOnboarding(false);

      if (isSkippedOnboarding && onboardingFileSchema) {
        const updatedOnboardingFileSchema = {
          ...onboardingFileSchema,
          isSkipped: true,
        };
        await actions.putOnboardingFile?.(
          onboardingFileName,
          onboardingFilePath,
          updatedOnboardingFileSchema,
        );
        setOnboardingFileSchema?.(updatedOnboardingFileSchema);
      }
    },
    [
      actions,
      onboardingFileName,
      onboardingFilePath,
      onboardingFileSchema,
      setIsShowOnboarding,
      setOnboardingFileSchema,
    ],
  );

  useEffect(() => {
    if (prompt && bucket) {
      createConversation(prompt);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bucket, prompt]);

  const getContent = () => {
    const isConversationCreationDisabled = !bucket;

    if (!isAgentAvailable) {
      return (
        <InlineAlert type={InlineAlertType.Error}>
          {statusMessages.assistantUnavailable}
        </InlineAlert>
      );
    }

    return (
      <>
        <InputForAsk
          containerClasses={classNames(
            inputMessageStyles.inputContainerClass,
            isBottomInputPosition && 'order-3 mt-auto',
          )}
          inputClasses="mr-2"
          disabled={isConversationCreationDisabled}
          placeholder={titles?.askAnything ?? 'Ask anything...'}
          sendMessageIcon={inputMessageStyles.sendMessageIcon}
          onSendMessage={createConversation}
        />
        <div className="no-scrollbar max-w-full overflow-x-auto">
          <div
            className={classNames(
              'flex flex-wrap justify-center gap-2 sm:flex-nowrap',
              'tags-container',
            )}
          >
            {suggestionsList.map((item) => (
              <Tag
                key={item.title}
                title={item.title}
                text={
                  item[DialSchemaProperties.DialWidgetOptions]?.populateText
                }
                disabled={isConversationCreationDisabled}
                onClick={createConversation}
              />
            ))}
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="flex size-full flex-col">
      {isCreatingConversation || (prompt && isBucketLoading) ? (
        <Loader />
      ) : isShowOnboarding ? (
        <ConversationOnboarding
          titles={titles}
          messageContent={
            onboardingMessageSchema?.properties?.choice?.description || ''
          }
          choiceButtons={
            onboardingMessageSchema?.properties?.choice?.oneOf || []
          }
          disabled={!bucket}
          handleOnboardingSkip={handleOnboardingSkip}
          onClick={createConversation}
        />
      ) : (
        <div className="flex h-full flex-col items-center justify-center sm:px-4">
          <div
            className={classNames(
              'flex items-center max-w-full sm-min:px-4',
              isBottomInputPosition ? 'mt-auto mb-8' : 'mb-6',
            )}
          >
            {titleIcon}
            <h1 className="sm:h2 text-center text-hues-800">
              {welcomeText ?? titles?.welcomeTitle ?? 'How can I help you?'}
            </h1>
          </div>
          {getContent()}
        </div>
      )}
      {isShowOnboarding && (
        <ChatOnboardingFooter
          titles={titles}
          openNewConversation={() => setIsShowOnboarding(false)}
        />
      )}
      {!isShowOnboarding && (
        <ChatFooter
          firstLine={titles.footerFirstLine}
          secondLine={titles.footerSecondLine}
        />
      )}
    </div>
  );
};
