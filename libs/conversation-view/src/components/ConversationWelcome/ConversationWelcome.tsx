'use client';

import {
  ConversationInfo,
  DialSchemaProperties,
  FormSchemaButtonOption,
  MessageFormSchema,
} from '@epam/ai-dial-shared';
import { transformSharedConversations } from '@epam/statgpt-conversation-list';
import {
  CreateConversationRequest,
  getSharedConversationsRequest,
  SharedConversations,
  SharedConversationsRequest,
  ShareTarget,
} from '@epam/statgpt-dial-toolkit';
import { cleanConversationNames } from '@epam/statgpt-shared-toolkit';
import { Loader } from '@epam/statgpt-ui-components';
import { Tag } from '@epam/statgpt-ui-components';
import classNames from 'classnames';
import { FC, ReactNode, useCallback, useEffect, useState } from 'react';
import { InputMessageStyles } from '../../models/message';
import { ConversationViewTitles } from '../../models/titles';
import { getCreateConversationRequest } from '../../utils/conversation-request';
import { generateOnboardingConversation } from '../../utils/generate-onboarding-conversation';
import InputForAsk from '../InputForAsk/InputForAsk';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { UserInfo } from '@statgpt/user-info/src/models/user-info';
// eslint-disable-next-line @nx/enforce-module-boundaries
import User from '@statgpt/user-info/src/components/User/User';
import { useOnboarding } from '../../context/OnboardingContext';
import { PutOnboardingFile } from '../../types/actions';
import ChatOnboardingFooter from '../ChatOnboardingFooter/ChatOnboardingFooter';
import { ConversationOnboarding } from '../ConversationOnboarding/ConversationOnboarding';

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
  userInfo?: UserInfo;
  signOutAction?: () => void;
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
  userInfo,
  signOutAction,
}) => {
  const [bucket, setBucket] = useState<string | null>(null);
  const [isCreatingConversation, setIsCreatingConversation] =
    useState<boolean>();
  const {
    onboardingFileSchema,
    onboardingFileName,
    onboardingFilePath,
    isShowOnboarding,
    setIsShowOnboarding,
    setOnboardingFileSchema,
  } = useOnboarding();

  useEffect(() => {
    const loadData = async () => {
      try {
        const bucketData = await actions.getBucket();
        setBucket(bucketData.bucket);
      } catch (err) {
        console.error(err instanceof Error ? err.message : 'Request error');
      }
    };

    loadData();
  }, [actions]);

  const createConversation = useCallback(
    async (message?: string, choiceId?: string) => {
      setIsCreatingConversation(true);
      if (!bucket) {
        console.error('No bucket');
      }

      try {
        const conversationRequestData = isShowOnboarding
          ? generateOnboardingConversation(
              bucket || '',
              locale,
              titles?.onboardingTitle ?? 'Introducing the AI assistant',
              onboardingMessageSchema?.properties?.choice?.description ?? '',
              message,
              choiceId,
            )
          : getCreateConversationRequest(
              bucket || '',
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

  return (
    <div className="flex flex-col h-full w-full">
      {prompt || isCreatingConversation ? (
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
          handleOnboardingSkip={handleOnboardingSkip}
          onClick={createConversation}
        />
      ) : (
        <div className="flex flex-col h-full items-center justify-center sm:px-4">
          {userInfo && (
            <div className="absolute top-4 right-4">
              <User
                userInfo={userInfo}
                signOutAction={signOutAction}
                title={titles?.signOut}
              />
            </div>
          )}
          <div
            className={classNames(
              'flex items-center max-w-full sm-min:px-4',
              isBottomInputPosition ? 'mt-auto mb-8' : 'mb-6',
            )}
          >
            {titleIcon}
            <h1 className="text-hues-800 text-center sm:h2">
              {welcomeText ?? titles?.welcomeTitle ?? 'How can I help you?'}
            </h1>
          </div>
          <InputForAsk
            containerClasses={classNames(
              'mb-6',
              inputMessageStyles.inputContainerClass,
              isBottomInputPosition && 'order-3 mt-auto',
            )}
            inputClasses="mr-2"
            placeholder={titles?.askAnything ?? 'Ask anything...'}
            sendMessageIcon={inputMessageStyles.sendMessageIcon}
            onSendMessage={createConversation}
          />
          <div className="max-w-full overflow-x-auto no-scrollbar">
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
                  onClick={createConversation}
                />
              ))}
            </div>
          </div>
        </div>
      )}
      {isShowOnboarding && (
        <ChatOnboardingFooter
          titles={titles}
          openNewConversation={() => setIsShowOnboarding(false)}
        />
      )}
    </div>
  );
};
