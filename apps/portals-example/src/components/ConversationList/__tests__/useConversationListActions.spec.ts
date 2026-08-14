import { renderHook } from '@testing-library/react';
import { useConversationListActions } from '../useConversationListActions';

const mockRouter = { push: jest.fn(), replace: jest.fn() };

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

jest.mock(
  '../../../utils/conversation/rename-conversation-and-sync-content',
  () => ({
    renameConversationAndSyncContent: jest.fn(),
  }),
);

jest.mock('@epam/statgpt-shared-toolkit', () => ({
  ...jest.requireActual('@epam/statgpt-shared-toolkit'),
  getConversationIdFromResourceUrl: jest.fn(),
}));

import { renameConversationAndSyncContent } from '../../../utils/conversation/rename-conversation-and-sync-content';
import { getConversationIdFromResourceUrl } from '@epam/statgpt-shared-toolkit';

describe('useConversationListActions', () => {
  it('keeps action function references stable when selectedConversationId changes', () => {
    const { result, rerender } = renderHook(
      ({ selectedConversationId }: { selectedConversationId?: string }) =>
        useConversationListActions(selectedConversationId, 'en'),
      { initialProps: { selectedConversationId: 'conv-1' } },
    );

    const firstActions = result.current.actions;

    rerender({ selectedConversationId: 'conv-2' });

    expect(result.current.actions.getConversations).toBe(
      firstActions.getConversations,
    );
    expect(result.current.actions.getSharedConversations).toBe(
      firstActions.getSharedConversations,
    );
    expect(result.current.actions.deleteConversation).toBe(
      firstActions.deleteConversation,
    );
    expect(result.current.actions.getConversation).toBe(
      firstActions.getConversation,
    );
    expect(result.current.actions.getFileBlob).toBe(firstActions.getFileBlob);
    expect(result.current.actions.renameConversation).toBe(
      firstActions.renameConversation,
    );
  });
});

describe('useConversationListActions renameConversation staleness', () => {
  beforeEach(() => {
    mockRouter.replace.mockClear();
    (renameConversationAndSyncContent as jest.Mock).mockResolvedValue({
      navPath: 'new-path',
      response: { success: true, data: undefined },
    });
    (getConversationIdFromResourceUrl as jest.Mock).mockReturnValue('conv-2');
  });

  it('navigates using the selectedConversationId current at call time, not at creation time', async () => {
    const { result, rerender } = renderHook(
      ({ selectedConversationId }: { selectedConversationId?: string }) =>
        useConversationListActions(selectedConversationId, 'en'),
      { initialProps: { selectedConversationId: 'conv-1' } },
    );

    const renameConversation = result.current.actions.renameConversation;

    rerender({ selectedConversationId: 'conv-2' });
    expect(result.current.actions.renameConversation).toBe(renameConversation);

    await renameConversation('source-url', 'dest-url');

    expect(mockRouter.replace).toHaveBeenCalledWith(
      '/en/conversations/new-path',
    );
  });
});
