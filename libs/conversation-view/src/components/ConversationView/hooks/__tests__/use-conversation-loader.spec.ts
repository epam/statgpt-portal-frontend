import { Role, SharePermission } from '@epam/ai-dial-shared';
import { renderHook, waitFor } from '@testing-library/react';

import { ConversationViewActions } from '../../../../models/actions';
import { useConversationLoader } from '../use-conversation-loader';

jest.mock('@epam/ai-dial-shared', () => ({
  Role: {
    Assistant: 'assistant',
    User: 'user',
  },
  SharePermission: {
    WRITE: 'write',
  },
}));

jest.mock('../../../../utils/request-cache', () => ({
  clearRequestCache: jest.fn(),
}));

describe('useConversationLoader', () => {
  const getBucket = jest.fn();
  const getConversation = jest.fn();
  const setConversation = jest.fn();
  const setCrossDatasetAttachmentsState = jest.fn();
  const sendMessageToConversation = jest.fn();
  const onConversationNotFound = jest.fn();

  const actions = {
    getBucket,
    getConversation,
  } as unknown as ConversationViewActions;

  beforeEach(() => {
    jest.clearAllMocks();
    getBucket.mockResolvedValue({ bucket: 'current-bucket' });
  });

  it('loads the conversation and clears cross-dataset attachments for the current key', async () => {
    const conversation = {
      id: 'current-bucket/en/conversation',
      messages: [{ id: 'user-message', role: Role.User }],
      permissions: [SharePermission.WRITE],
    };
    getConversation.mockResolvedValue(conversation);

    const { result } = renderHook(() =>
      useConversationLoader({
        conversationKey: 'current-bucket%20conversation',
        actions,
        setConversation,
        setCrossDatasetAttachmentsState,
        sendMessageToConversation,
        onConversationNotFound,
      }),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(getConversation).toHaveBeenCalledWith('current-bucket conversation');
    expect(setCrossDatasetAttachmentsState).toHaveBeenCalledTimes(1);
    expect(setConversation).toHaveBeenCalledWith(conversation);
    expect(result.current.isReadonlyConversation).toBe(false);
  });

  it('auto-sends the stored prompt when the loaded conversation has no user messages', async () => {
    const conversation = {
      id: 'current-bucket/en/conversation',
      prompt: 'Explain GDP',
      messages: [{ id: 'seed', role: Role.Assistant }],
      permissions: [SharePermission.WRITE],
    };
    getConversation.mockResolvedValue(conversation);

    renderHook(() =>
      useConversationLoader({
        conversationKey: 'conversation',
        actions,
        setConversation,
        setCrossDatasetAttachmentsState,
        sendMessageToConversation,
      }),
    );

    await waitFor(() =>
      expect(sendMessageToConversation).toHaveBeenCalledWith(
        'Explain GDP',
        conversation,
      ),
    );
  });

  it('marks external read-only conversations as read-only', async () => {
    getConversation.mockResolvedValue({
      id: 'shared-bucket/en/conversation',
      messages: [{ id: 'message', role: Role.User }],
      permissions: [],
    });

    const { result } = renderHook(() =>
      useConversationLoader({
        conversationKey: 'conversation',
        actions,
        setConversation,
        setCrossDatasetAttachmentsState,
        sendMessageToConversation,
      }),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isReadonlyConversation).toBe(true);
  });

  it('reports missing conversations and leaves the view read-only', async () => {
    getConversation.mockRejectedValueOnce(new Error('not found'));

    const { result } = renderHook(() =>
      useConversationLoader({
        conversationKey: 'missing-conversation',
        actions,
        setConversation,
        setCrossDatasetAttachmentsState,
        sendMessageToConversation,
        onConversationNotFound,
      }),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isReadonlyConversation).toBe(true);
    expect(onConversationNotFound).toHaveBeenCalledTimes(1);
  });
});
