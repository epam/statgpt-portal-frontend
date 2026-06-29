import { act, renderHook } from '@testing-library/react';

import { ConversationViewActions } from '../../../../models/actions';
import { duplicateConversationAttachments } from '../../../../utils/duplicate-conversation-attachments';
import { generateConversation } from '../../../../utils/generate-conversation';
import { getRedirectConversationPath } from '../../../../utils/get-conversation-path';
import { useConversationLifecycle } from '../use-conversation-lifecycle';

jest.mock('@epam/ai-dial-shared', () => ({}));

jest.mock('@epam/statgpt-shared-toolkit', () => ({
  cleanConversationNames: jest.fn((conversations) =>
    conversations.map((conversation: any) => ({
      ...conversation,
      cleaned: true,
    })),
  ),
}));

jest.mock('../../../../utils/duplicate-conversation-attachments', () => ({
  duplicateConversationAttachments: jest.fn(),
}));

jest.mock('../../../../utils/generate-conversation', () => ({
  generateConversation: jest.fn(),
}));

jest.mock('../../../../utils/get-conversation-path', () => ({
  getRedirectConversationPath: jest.fn(),
}));

describe('useConversationLifecycle', () => {
  const duplicateConversationAttachmentsMock =
    duplicateConversationAttachments as jest.Mock;
  const generateConversationMock = generateConversation as jest.Mock;
  const getRedirectConversationPathMock =
    getRedirectConversationPath as jest.Mock;

  const getBucket = jest.fn();
  const getFileBlob = jest.fn();
  const putFile = jest.fn();
  const createConversation = jest.fn();
  const getConversations = jest.fn();
  const setConversations = jest.fn();
  const openUrl = jest.fn();

  const actions = {
    getBucket,
    getFileBlob,
    putFile,
    createConversation,
    getConversations,
  } as unknown as ConversationViewActions;

  beforeEach(() => {
    jest.clearAllMocks();
    getBucket.mockResolvedValue({ bucket: 'bucket' });
    getConversations.mockResolvedValue([{ id: 'conversation-info' }]);
    duplicateConversationAttachmentsMock.mockResolvedValue({
      id: 'duplicated-source',
      name: 'Copy source',
    });
    generateConversationMock.mockReturnValue({
      id: 'new-conversation',
      name: 'Copy source',
    });
    getRedirectConversationPathMock.mockReturnValue(
      '/en/conversations/new-conversation',
    );
  });

  it('opens the locale-specific new conversation route', () => {
    const { result } = renderHook(() =>
      useConversationLifecycle({
        actions,
        conversation: null,
        locale: 'en',
        conversationsRoute: '/conversations',
        openUrl,
        setConversations,
      }),
    );

    act(() => {
      result.current.handleOpeningOfNewConversation();
    });

    expect(openUrl).toHaveBeenCalledWith('/en/conversations');
  });

  it('duplicates attachments, creates a copy, refreshes the list and navigates to it', async () => {
    const conversation = {
      id: 'source',
      name: 'Copy source',
      messages: [],
    };
    const { result } = renderHook(() =>
      useConversationLifecycle({
        actions,
        conversation: conversation as any,
        locale: 'en',
        conversationsRoute: '/conversations',
        openUrl,
        setConversations,
      }),
    );

    await act(async () => {
      await result.current.duplicateConversation();
    });

    expect(duplicateConversationAttachmentsMock).toHaveBeenCalledWith({
      conversation,
      bucket: 'bucket',
      getFileBlob,
      putFile,
    });
    expect(generateConversationMock).toHaveBeenCalledWith(
      { id: 'duplicated-source', name: 'Copy source' },
      'bucket',
      'en',
    );
    expect(createConversation).toHaveBeenCalledWith(
      { id: 'new-conversation', name: 'Copy source' },
      'en',
    );
    expect(setConversations).toHaveBeenCalledWith([
      { id: 'conversation-info', cleaned: true },
    ]);
    expect(openUrl).toHaveBeenCalledWith('/en/conversations/new-conversation');
  });

  it('uses the original conversation when file actions are unavailable', async () => {
    const actionsWithoutFiles = {
      getBucket,
      createConversation,
      getConversations,
    } as unknown as ConversationViewActions;
    const conversation = { id: 'source', messages: [] };

    const { result } = renderHook(() =>
      useConversationLifecycle({
        actions: actionsWithoutFiles,
        conversation: conversation as any,
        locale: 'en',
        conversationsRoute: '/conversations',
        openUrl,
        setConversations,
      }),
    );

    await act(async () => {
      await result.current.duplicateConversation();
    });

    expect(duplicateConversationAttachmentsMock).not.toHaveBeenCalled();
    expect(generateConversationMock).toHaveBeenCalledWith(
      conversation,
      'bucket',
      'en',
    );
  });
});
