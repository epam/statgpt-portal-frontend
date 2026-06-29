import { renderHook } from '@testing-library/react';

import { ConversationViewActions } from '../../../../models/actions';
import { useConversationSaver } from '../use-conversation-saver';

jest.mock('@epam/ai-dial-shared', () => ({}));

describe('useConversationSaver', () => {
  const updateConversation = jest.fn();
  const actions = {
    updateConversation,
  } as unknown as ConversationViewActions;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('saves only the editable conversation fields', async () => {
    const { result } = renderHook(() =>
      useConversationSaver({
        actions,
        conversationKey: 'bucket%20conversation',
      }),
    );

    await result.current({
      id: 'bucket/conversation',
      name: 'Quarterly outlook',
      messages: [{ id: 'msg-1', content: 'Hello' }],
      customViewState: { view: 'advanced' },
      prompt: 'ignored',
      folderId: 'ignored',
    } as any);

    expect(updateConversation).toHaveBeenCalledWith('bucket conversation', {
      name: 'Quarterly outlook',
      messages: [{ id: 'msg-1', content: 'Hello' }],
      customViewState: { view: 'advanced' },
    });
  });

  it('logs save failures without rethrowing', async () => {
    const error = new Error('network failed');
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    updateConversation.mockRejectedValueOnce(error);

    const { result } = renderHook(() =>
      useConversationSaver({
        actions,
        conversationKey: 'conversation',
      }),
    );

    await expect(
      result.current({ name: 'Draft', messages: [] } as any),
    ).resolves.toBeUndefined();

    expect(consoleError).toHaveBeenCalledWith(
      'Failed to save conversation:',
      error,
    );

    consoleError.mockRestore();
  });
});
