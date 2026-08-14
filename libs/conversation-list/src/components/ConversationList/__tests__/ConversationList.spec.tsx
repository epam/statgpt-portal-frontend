import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ConversationInfo } from '@epam/ai-dial-shared';
import { ConversationList } from '../ConversationList';
import { ConversationListActions } from '../../../models/conversation-list';

function buildActions(): ConversationListActions {
  return {
    getConversations: jest.fn().mockResolvedValue([]),
    getSharedConversations: jest.fn().mockResolvedValue([]),
    deleteConversation: jest.fn(),
    getConversation: jest.fn(),
    getFileBlob: jest.fn(),
    renameConversation: jest.fn(),
  };
}

function buildEarlierConversation(): ConversationInfo {
  const updatedAt = Date.now() - 30 * 24 * 60 * 60 * 1000;
  return {
    id: 'conv-1',
    name: 'earlier conversation',
    updatedAt,
  } as ConversationInfo;
}

function buildProps(
  overrides: Partial<React.ComponentProps<typeof ConversationList>> = {},
): React.ComponentProps<typeof ConversationList> {
  return {
    actions: buildActions(),
    isCollapsed: false,
    locale: 'en',
    conversationStyles: { titles: {} as never },
    conversations: [buildEarlierConversation()],
    sharedConversations: [],
    setConversations: jest.fn(),
    setSharedConversations: jest.fn(),
    handleConversationClick: jest.fn(),
    handleSelectedConversationRemove: jest.fn(),
    ...overrides,
  };
}

describe('ConversationList group collapse persistence', () => {
  it('keeps a group collapsed after the sidebar is hidden and shown again', async () => {
    const props = buildProps();
    const { rerender } = render(<ConversationList {...props} />);

    await waitFor(() => expect(screen.getByText('Earlier')).toBeTruthy());
    expect(screen.getByText('earlier conversation')).toBeTruthy();

    fireEvent.click(screen.getByText('Earlier'));
    expect(screen.queryByText('earlier conversation')).toBeNull();

    rerender(<ConversationList {...props} isCollapsed />);
    rerender(<ConversationList {...props} isCollapsed={false} />);

    expect(screen.queryByText('earlier conversation')).toBeNull();
  });
});

describe('ConversationList loading spinner', () => {
  // A locale change is one example of a loadData-triggering re-render after
  // the initial load; it should refresh data without unmounting the tree.
  it('does not re-show the loader on a second load once already loaded', async () => {
    const getConversations = jest.fn().mockResolvedValue([]);
    const props = buildProps({
      actions: {
        ...buildActions(),
        getConversations,
      },
    });

    const { rerender } = render(<ConversationList {...props} />);

    await waitFor(() => expect(getConversations).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByText('Earlier')).toBeTruthy());

    getConversations.mockResolvedValueOnce([]);
    rerender(<ConversationList {...props} locale="fr" />);

    expect(screen.queryByText('Earlier')).toBeTruthy();
  });
});

describe('ConversationList collapse rendering', () => {
  // Comparing DOM node identity (not just presence) before/after the toggle
  // proves React never unmounted/remounted the group, not merely hid it.
  it('does not unmount ConversationsGroup when isCollapsed toggles true and back to false', async () => {
    const props = buildProps();
    const { rerender } = render(
      <ConversationList {...props} isCollapsed={false} />,
    );

    await waitFor(() => expect(screen.getByText('Earlier')).toBeTruthy());
    const groupHeaderBeforeCollapse = screen.getByText('Earlier');

    rerender(<ConversationList {...props} isCollapsed />);
    expect(document.body.contains(groupHeaderBeforeCollapse)).toBe(true);

    rerender(<ConversationList {...props} isCollapsed={false} />);
    const groupHeaderAfterExpand = screen.getByText('Earlier');

    expect(groupHeaderAfterExpand).toBe(groupHeaderBeforeCollapse);
  });
});
