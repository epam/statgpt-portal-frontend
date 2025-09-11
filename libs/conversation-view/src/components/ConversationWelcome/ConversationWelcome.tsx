'use client';

import {
  FormSchemaButtonOption,
  DialSchemaProperties,
} from '@epam/ai-dial-shared';
import InputForAsk from '@statgpt/conversation-view/src/components/InputForAsk/InputForAsk';
import { Tag } from '@statgpt/ui-components/src/components/Tag/Tag';
import { FC, ReactNode, useCallback, useEffect, useState } from 'react';
import classNames from 'classnames';
import { ConversationInfo } from '@epam/ai-dial-shared';
import {
  CreateConversationRequest,
  SharedConversationsRequest,
  SharedConversations,
} from '@statgpt/dial-toolkit/src/models/conversation';
import { getCreateConversationRequest } from '@statgpt/conversation-list/src/utils/conversation-request';
import { InputMessageStyles } from '@statgpt/conversation-view/src/models/message';
import { cleanConversationNames } from '@statgpt/conversation-list/src/utils/conversation-mapping';
import { Loader } from '@statgpt/ui-components/src/components/Loader/Loader';
import { ConversationViewTitles } from '@statgpt/conversation-view/src/models/titles';
import { ShareTarget } from '@statgpt/dial-toolkit/src/constants/share-conversation';
import { updateConversationsWithSharedOption } from '@statgpt/conversation-list/src/utils/shared-conversations';
import { getSharedConversationsRequest } from '@statgpt/dial-toolkit/src/utils/shared-conversations-request';

interface ConversationListActions {
  getBucket: () => Promise<{ bucket: string }>;
  createConversation: (
    request: CreateConversationRequest,
    locale: string,
  ) => Promise<ConversationInfo>;
  getConversations: (locale: string) => Promise<ConversationInfo[]>;
  getSharedConversations: (
    requestData?: SharedConversationsRequest,
  ) => Promise<SharedConversations>;
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
  handleConversationClick: (folderId: string, conversationId: string) => void;
  setConversations: (conversations: ConversationInfo[]) => void;
  setSharedConversations: (sharedConversations: ConversationInfo[]) => void;
}

const ConversationWelcome: FC<Props> = ({
  suggestionsList,
  welcomeText,
  titleIcon,
  actions,
  titles,
  inputMessageStyles,
  isBottomInputPosition,
  prompt,
  handleConversationClick,
  setConversations,
  locale,
  setSharedConversations,
}) => {
  const [bucket, setBucket] = useState<string | null>(null);
  const [isCreatingConversation, setIsCreatingConversation] =
    useState<boolean>();

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
    async (message?: string) => {
      setIsCreatingConversation(true);
      if (!bucket) {
        console.error('No bucket');
      }

      try {
        const newConversation = await actions.createConversation(
          getCreateConversationRequest(
            bucket || '',
            locale,
            titles.newChat ?? 'New chat',
            message,
          ),
          locale,
        );
        const conversationsData = await actions.getConversations(locale);
        const sharedConversationsData = await actions.getSharedConversations(
          getSharedConversationsRequest(ShareTarget.ME),
        );

        setConversations(cleanConversationNames(conversationsData));
        setSharedConversations(
          cleanConversationNames(
            updateConversationsWithSharedOption(
              sharedConversationsData,
              locale,
            ),
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
      titles,
      bucket,
      handleConversationClick,
      setConversations,
      setSharedConversations,
      actions,
      locale,
    ],
  );

  useEffect(() => {
    if (prompt && bucket) {
      createConversation(prompt);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bucket, prompt]);

  return (
    <>
      {prompt || isCreatingConversation ? (
        <Loader />
      ) : (
        <div className="flex flex-col h-full items-center justify-center sm:px-4">
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
    </>
  );
};

export default ConversationWelcome;
