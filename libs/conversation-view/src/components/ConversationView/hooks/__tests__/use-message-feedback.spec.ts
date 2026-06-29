import { LikeState, Role } from '@epam/ai-dial-shared';
import { act, renderHook } from '@testing-library/react';
import { useState } from 'react';

import { ConversationViewActions } from '../../../../models/actions';
import { useMessageFeedback } from '../use-message-feedback';

jest.mock('@epam/ai-dial-shared', () => ({
  LikeState: {
    Disliked: 'disliked',
    Liked: 'liked',
  },
  Role: {
    System: 'system',
  },
}));

describe('useMessageFeedback', () => {
  const rateResponseAction = jest.fn();
  const saveConversation = jest.fn();
  const actions = {
    rateResponse: rateResponseAction,
  } as unknown as ConversationViewActions;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function renderStatefulHook(initialConversation: any) {
    return renderHook(() => {
      const [conversation, setConversation] = useState(initialConversation);

      return {
        conversation,
        feedback: useMessageFeedback({
          actions,
          conversation,
          setConversation,
          saveConversation,
        }),
      };
    });
  }

  it('rates a response and persists the updated conversation', () => {
    const conversation = {
      id: 'conversation',
      model: { id: 'model-id' },
      messages: [
        { id: 'assistant-1', responseId: 'response-1', content: 'Answer' },
        { id: 'assistant-2', responseId: 'response-2', content: 'Other' },
      ],
    };
    const { result } = renderStatefulHook(conversation);

    act(() => {
      result.current.feedback.rateResponse('response-1', LikeState.Liked);
    });

    expect(rateResponseAction).toHaveBeenCalledWith(
      'response-1',
      true,
      'model-id',
    );
    expect(conversation.messages[0]).toMatchObject({
      responseId: 'response-1',
      like: LikeState.Liked,
    });
    expect(saveConversation).toHaveBeenCalledWith(conversation);
  });

  it('does not rate a response when the model id is missing', () => {
    const { result } = renderStatefulHook({
      id: 'conversation',
      messages: [{ id: 'assistant', responseId: 'response-1' }],
    });

    act(() => {
      result.current.feedback.rateResponse('response-1', LikeState.Disliked);
    });

    expect(rateResponseAction).not.toHaveBeenCalled();
    expect(saveConversation).not.toHaveBeenCalled();
  });

  it('replaces an edited python attachment and saves the conversation', () => {
    const newAttachment = {
      title: 'updated.py',
      type: 'text/markdown',
      data: '```python\nprint("updated")\n```',
    };
    const { result } = renderStatefulHook({
      id: 'conversation',
      messages: [
        {
          id: 'system-message',
          role: Role.System,
          custom_content: {
            attachments: [
              {
                title: 'original.py',
                type: 'text/markdown',
                data: '```python\nprint("old")\n```',
              },
            ],
          },
        },
      ],
    });

    act(() => {
      result.current.feedback.handleCodeAttachmentUpdated(
        'system-message',
        newAttachment as any,
      );
    });

    expect(
      result.current.conversation.messages[0].custom_content.attachments,
    ).toEqual([newAttachment]);
    expect(saveConversation).toHaveBeenCalledWith(result.current.conversation);
  });
});
