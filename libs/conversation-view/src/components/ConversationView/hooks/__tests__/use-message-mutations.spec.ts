import { Role } from '@epam/ai-dial-shared';
import { act, renderHook } from '@testing-library/react';
import { useState } from 'react';

import { useMessageMutations } from '../use-message-mutations';

jest.mock('@epam/ai-dial-shared', () => ({
  Role: {
    Assistant: 'assistant',
    User: 'user',
  },
}));

jest.mock('@epam/statgpt-dial-toolkit', () => ({
  mergeMessages: jest.fn((message, partials) => ({
    ...message,
    ...partials[0],
    content: `${message.content}${partials[0].content ?? ''}`,
  })),
}));

describe('useMessageMutations', () => {
  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(1000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function renderStatefulHook(initialConversation: any) {
    return renderHook(() => {
      const [conversation, setConversation] = useState(initialConversation);

      return {
        conversation,
        mutations: useMessageMutations({ setConversation }),
      };
    });
  }

  it('appends a user message to the current conversation', () => {
    const { result } = renderStatefulHook({
      id: 'conversation',
      messages: [{ id: 'existing', content: 'Existing' }],
    });

    act(() => {
      result.current.mutations.addUserMessageToConversation({
        id: 'user',
        role: Role.User,
        content: 'Question',
      } as any);
    });

    expect(result.current.conversation.messages).toEqual([
      { id: 'existing', content: 'Existing' },
      { id: 'user', role: Role.User, content: 'Question' },
    ]);
  });

  it('creates and appends an empty assistant message', () => {
    const { result } = renderStatefulHook({
      id: 'conversation',
      messages: [],
    });

    let assistantMessage: any;
    act(() => {
      assistantMessage = result.current.mutations.initializeAssistantMessage();
    });

    expect(assistantMessage).toEqual({
      id: 'msg-1001',
      role: Role.Assistant,
      content: '',
      timestamp: 1000,
    });
    expect(result.current.conversation.messages).toEqual([assistantMessage]);
  });

  it('merges assistant partials into the matching message', () => {
    const assistantMessage = {
      id: 'assistant',
      role: Role.Assistant,
      content: 'Hel',
    };
    const { result } = renderStatefulHook({
      id: 'conversation',
      messages: [
        { id: 'user', role: Role.User, content: 'Question' },
        assistantMessage,
      ],
    });

    let updatedMessage: any;
    act(() => {
      updatedMessage = result.current.mutations.updateAssistantMessage(
        assistantMessage as any,
        { content: 'lo', responseId: 'response-1' } as any,
      );
    });

    expect(updatedMessage).toMatchObject({
      id: 'assistant',
      content: 'Hello',
      responseId: 'response-1',
    });
    expect(result.current.conversation.messages[1]).toEqual(updatedMessage);
  });
});
