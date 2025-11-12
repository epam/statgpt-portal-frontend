/**
 * ConversationList - Conversation management and navigation component
 *
 * A React component for displaying, creating, and managing chat conversations.
 * Supports internationalization, custom rendering through render props,
 * conversation CRUD operations, and locale-aware navigation. Integrates
 * with the backend API for persistent conversation storage.
 */
/* eslint-disable @nx/enforce-module-boundaries */
'use client';

import classNames from 'classnames';
import {
  FC,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import ConversationsGroup from '../ConversationsGroup/ConversationsGroup';
import ConversationsSearchField from '../ConversationsSearch/ConversationsSearchField';
import ConversationsSearchResult from '../ConversationsSearch/ConversationsSearchResult';
import NoConversations from '../NoConversations/NoConversations';
import {
  ConversationListActions,
  ConversationStyles,
  GroupedConversations,
} from '../../models/conversation-list';
import { getConversationsGroupedByDate } from '../../utils/conversations-grouping';
import { ConversationInfo } from '@epam/ai-dial-shared';
import {
  getSharedConversationsRequest,
  ShareTarget,
} from '@epam/statgpt-dial-toolkit';
import { ShareConversationProps } from '@statgpt/share-conversation/src/models/share-conversation';
import { cleanConversationNames } from '@epam/statgpt-shared-toolkit';
import { Loader } from '@epam/statgpt-ui-components';

import {
  getSharedConversationsGroup,
  transformSharedConversations,
} from '../../utils/shared-conversations';

interface Props {
  selectedConversationId?: string;
  actions: ConversationListActions;
  children?: ReactNode;
  isCollapsed: boolean;
  locale: string;
  conversationStyles: ConversationStyles;
  conversations: ConversationInfo[];
  sharedConversations: ConversationInfo[];
  shareConversationProps?: ShareConversationProps;
  setConversations: (conversations: ConversationInfo[]) => void;
  setSharedConversations: (sharedConversations: ConversationInfo[]) => void;
  handleConversationClick: (folder: string, conversationKey: string) => void;
  handleSelectedConversationRemove: () => void;
}

export const ConversationList: FC<Props> = ({
  handleConversationClick,
  selectedConversationId,
  actions,
  children,
  isCollapsed,
  conversationStyles,
  conversations,
  locale,
  sharedConversations,
  setConversations,
  setSharedConversations,
  shareConversationProps,
  handleSelectedConversationRemove,
}) => {
  const [groupedConversations, setGroupedConversations] =
    useState<GroupedConversations>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isExpandedSearch, setIsExpandedSearch] = useState<boolean>(false);
  const {
    getConversations,
    getSharedConversations,
    deleteConversation,
    renameConversation,
  } = actions;

  const isSearchConversations = useMemo(() => {
    return !!searchQuery?.length;
  }, [searchQuery]);

  useEffect(() => {
    setGroupedConversations({
      ...getSharedConversationsGroup(sharedConversations),
      ...getConversationsGroupedByDate(conversations),
    });
  }, [conversations, sharedConversations]);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const conversationsData = await getConversations(locale);
        const sharedConversationsData = await getSharedConversations(
          getSharedConversationsRequest(ShareTarget.ME),
        );
        setConversations(cleanConversationNames(conversationsData));
        setSharedConversations(
          cleanConversationNames(
            transformSharedConversations(sharedConversationsData, locale),
          ),
        );
      } catch (err) {
        console.error('Error loading conversation', err as object);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [
    getConversations,
    setConversations,
    locale,
    getSharedConversations,
    setSharedConversations,
  ]);

  const handleDeleteConversation = useCallback(
    async (conversation: ConversationInfo) => {
      try {
        await deleteConversation(conversation);
        const conversationsData = await getConversations(locale);
        const sharedConversationsData = await getSharedConversations(
          getSharedConversationsRequest(ShareTarget.ME),
        );

        setConversations(cleanConversationNames(conversationsData));
        setSharedConversations(
          cleanConversationNames(
            transformSharedConversations(sharedConversationsData, locale),
          ),
        );
        if (selectedConversationId === conversation?.id) {
          handleSelectedConversationRemove();
        }
      } catch (err) {
        console.error('Error deleting conversation', err as object);
      }
    },
    [
      deleteConversation,
      getConversations,
      locale,
      getSharedConversations,
      setConversations,
      setSharedConversations,
      selectedConversationId,
      handleSelectedConversationRemove,
    ],
  );

  const handleRenameConversation = useCallback(
    async (sourceUrl: string, destinationUrl: string) => {
      try {
        setIsLoading(true);
        await renameConversation(sourceUrl, destinationUrl);
        const conversationsData = await getConversations(locale);
        const sharedConversationsData = await getSharedConversations(
          getSharedConversationsRequest(ShareTarget.ME),
        );

        setConversations(cleanConversationNames(conversationsData));
        setSharedConversations(
          cleanConversationNames(
            transformSharedConversations(sharedConversationsData, locale),
          ),
        );
      } catch (err) {
        console.error('Error renaming conversation', err as object);
      } finally {
        setIsLoading(false);
      }
    },
    [
      getConversations,
      locale,
      getSharedConversations,
      setConversations,
      setSharedConversations,
      renameConversation,
    ],
  );

  const onSearchConversations = useCallback(
    (search: string) => {
      setSearchQuery(search);
    },
    [setSearchQuery],
  );

  const toggleSearchField = useCallback(() => {
    setIsExpandedSearch((previousValue) => !previousValue);
    setSearchQuery('');
  }, [setIsExpandedSearch]);

  return isLoading ? (
    <Loader />
  ) : (
    <>
      {!isCollapsed && (
        <div
          className={classNames(
            'flex justify-between items-center',
            isExpandedSearch ? ' pt-4 pb-0 sm:pt-10' : ' pt-6 pb-2 sm:pt-10',
          )}
        >
          {!isExpandedSearch && (
            <h3 className="text-neutrals-700 sm:body-2">
              {conversationStyles?.titles?.allChats ?? 'All Chats'}
            </h3>
          )}
          <ConversationsSearchField
            searchQuery={searchQuery}
            searchIcon={conversationStyles.searchIcon}
            titles={conversationStyles.titles}
            isExpandedSearch={isExpandedSearch}
            onSearchConversations={onSearchConversations}
            toggleSearchField={toggleSearchField}
          />
        </div>
      )}
      <div
        className={classNames(
          'overflow-y-auto flex flex-col mt-4 flex-1 min-h-0 pr-2',
          isSearchConversations ? 'gap-y-1' : 'gap-y-6',
        )}
      >
        {!isCollapsed ? (
          <>
            {conversations?.length === 0 &&
            sharedConversations?.length === 0 ? (
              <NoConversations titles={conversationStyles.titles} />
            ) : isSearchConversations ? (
              <ConversationsSearchResult
                locale={locale}
                conversationStyles={conversationStyles}
                conversations={[...sharedConversations, ...conversations]}
                searchQuery={searchQuery}
                selectedConversationId={selectedConversationId}
                handleConversationClick={handleConversationClick}
                shareConversationProps={shareConversationProps}
                actions={{
                  ...actions,
                  deleteConversation: handleDeleteConversation,
                }}
              />
            ) : (
              Object.entries(groupedConversations).map(
                ([groupLabel, conversations]) =>
                  conversations?.length > 0 && (
                    <ConversationsGroup
                      locale={locale}
                      key={groupLabel}
                      groupLabel={groupLabel}
                      conversationStyles={conversationStyles}
                      groupedConversations={conversations}
                      handleConversationClick={handleConversationClick}
                      actions={{
                        ...actions,
                        deleteConversation: handleDeleteConversation,
                        renameConversation: handleRenameConversation,
                      }}
                      shareConversationProps={shareConversationProps}
                      selectedConversationId={selectedConversationId}
                    />
                  ),
              )
            )}
          </>
        ) : null}
      </div>
      {children}
    </>
  );
};
