'use client';

import { FC } from 'react';
import { IconSearch, IconX } from '@tabler/icons-react';
import { Button, IconButton, InputWithIcon } from '@epam/statgpt-ui-components';
import { useConversationStyles } from '../../context/ConversationStylesContext';

interface Props {
  searchQuery?: string;
  isExpandedSearch?: boolean;
  onSearchConversations?: (search: string) => void;
  toggleSearchField?: () => void;
}

const ConversationsSearchField: FC<Props> = ({
  searchQuery,
  isExpandedSearch,
  onSearchConversations,
  toggleSearchField,
}) => {
  const { titles, searchIcon } = useConversationStyles();
  return (
    <>
      {isExpandedSearch ? (
        <InputWithIcon
          inputId="conversations-search"
          placeholder={titles?.searchPlaceholder ?? 'Search'}
          containerClasses="conversation-list-search-input h-[40px] bg-transparent px-4 py-2 rounded-full border-neutrals-400 shadow-none"
          cssClass="h-auto"
          value={searchQuery}
          iconAfterInput={
            <IconButton
              buttonClassName="text-button-tertiary items-center p-0 ml-4 border-0 w-5 h-5"
              onClick={toggleSearchField}
              icon={<IconX />}
            />
          }
          onChange={onSearchConversations}
        />
      ) : (
        <Button
          buttonClassName="text-button-tertiary p-0 search-button"
          iconBefore={searchIcon || <IconSearch className="size-5" />}
          onClick={toggleSearchField}
        />
      )}
    </>
  );
};

export default ConversationsSearchField;
