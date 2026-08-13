import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConversationInfo } from '@epam/ai-dial-shared';
import ConversationsGroup from '../ConversationsGroup';
import { ConversationStylesContext } from '../../../context/ConversationStylesContext';
import {
  ConversationListActionsProvider,
  ConversationListActionsContextValue,
} from '../../../context/ConversationListActionsContext';
import { ConversationStyles } from '../../../models/conversation-list';

const conversationStyles: ConversationStyles = { titles: {} as never };

const conversationListActions: ConversationListActionsContextValue = {
  locale: 'en',
  deleteConversation: jest.fn(),
  renameConversation: jest.fn(),
  getConversation: jest.fn(),
  getFileBlob: jest.fn(),
};

function renderGroup(
  overrides: Partial<React.ComponentProps<typeof ConversationsGroup>> = {},
) {
  const conversation: ConversationInfo = {
    id: 'conv-1',
    name: 'conversation 1',
  } as ConversationInfo;

  const props: React.ComponentProps<typeof ConversationsGroup> = {
    groupLabel: 'Earlier',
    groupedConversations: [conversation],
    handleConversationClick: jest.fn(),
    isCollapsed: false,
    onToggleCollapse: jest.fn(),
    ...overrides,
  };

  return render(
    <ConversationListActionsProvider value={conversationListActions}>
      <ConversationStylesContext.Provider value={conversationStyles}>
        <ConversationsGroup {...props} />
      </ConversationStylesContext.Provider>
    </ConversationListActionsProvider>,
  );
}

describe('ConversationsGroup', () => {
  it('renders conversations when isCollapsed is false', () => {
    renderGroup({ isCollapsed: false });

    expect(screen.getByText('conversation 1')).toBeTruthy();
  });

  it('does not render conversations when isCollapsed is true', () => {
    renderGroup({ isCollapsed: true });

    expect(screen.queryByText('conversation 1')).toBeNull();
  });

  it('calls onToggleCollapse exactly once when the header is clicked', () => {
    const onToggleCollapse = jest.fn();
    renderGroup({ onToggleCollapse });

    fireEvent.click(screen.getByText('Earlier'));

    expect(onToggleCollapse).toHaveBeenCalledTimes(1);
  });
});
