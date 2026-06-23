import { Role } from '@epam/ai-dial-shared';
import { act, renderHook } from '@testing-library/react';

import { useConversationStreaming } from '../use-conversation-streaming';

jest.mock('@epam/ai-dial-shared', () => ({
  Role: {
    Assistant: 'assistant',
    System: 'system',
    User: 'user',
  },
}));

jest.mock('@epam/statgpt-dial-toolkit', () => ({
  CUSTOM_VIEW_STATE_KEY: 'statgpt',
  DIAL_ERROR_CODES: {
    CONTENT_FILTER: 'content_filter',
  },
  DIAL_ERROR_TYPES: {
    RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  },
  ERROR_CONTEXT_KIND: {
    RATE_LIMIT: 'rate_limit',
  },
  streamChatResponse: jest.fn(),
}));

jest.mock('@epam/statgpt-shared-toolkit', () => ({
  HTTP_ERROR_CODES: {
    BAD_REQUEST: 400,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
    TOO_MANY_REQUESTS: 429,
  },
  HttpError: class HttpError extends Error {
    readonly isHttpError = true;
    readonly status: number;
    readonly code?: string;
    readonly displayMessage?: string;
    readonly details?: unknown;

    constructor(payload: {
      status: number;
      code?: string;
      message: string;
      displayMessage?: string;
      details?: unknown;
    }) {
      super(payload.message);
      this.name = 'HttpError';
      this.status = payload.status;
      this.code = payload.code;
      this.displayMessage = payload.displayMessage;
      this.details = payload.details;
    }
  },
  isHttpError: (error: any) => error?.isHttpError === true,
}));

jest.mock('../../../../utils/timezone', () => ({
  getTimezone: () => 'Europe/Prague',
}));

const { streamChatResponse } = jest.requireMock(
  '@epam/statgpt-dial-toolkit',
) as {
  streamChatResponse: jest.Mock;
};

const statusMessages = {
  assistantUnavailable: 'Assistant unavailable',
  serverError: 'Server error',
  serverOverloaded: 'Server overloaded',
  contentFilterError: 'Content filter error',
  getAssistantRestoreMessage: jest.fn(),
  getExceededLimitsMessage: jest.fn(),
};

describe('useConversationStreaming', () => {
  const saveConversation = jest.fn();
  const setConversation = jest.fn();
  const setIsStreaming = jest.fn();
  const addUserMessageToConversation = jest.fn();
  const initializeAssistantMessage = jest.fn();
  const updateAssistantMessage = jest.fn();
  const handleInvalidStreaming = jest.fn();

  const conversation = {
    id: 'bucket/en/conversation',
    name: 'Conversation',
    model: { id: 'model-id' },
    messages: [{ id: 'existing', role: Role.User, content: 'Previous' }],
    custom_fields: {
      configuration: {
        language: 'en',
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, 'now').mockReturnValue(1000);
    saveConversation.mockResolvedValue(undefined);
    initializeAssistantMessage.mockReturnValue({
      id: 'assistant-message',
      role: Role.Assistant,
      content: '',
    });
    updateAssistantMessage.mockImplementation((message, partial) => ({
      ...message,
      ...partial,
      content: `${message.content}${partial.content ?? ''}`,
    }));
    streamChatResponse.mockImplementation(async (_id, _messages, options) => {
      options.onMessage({
        id: 'response-id',
        choices: [
          {
            delta: {
              content: 'Answer',
              role: Role.Assistant,
            },
          },
        ],
      });
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function renderStreamingHook(overrides: Record<string, unknown> = {}) {
    return renderHook(() =>
      useConversationStreaming({
        conversation: conversation as any,
        setConversation,
        saveConversation,
        updateAssistantMessage,
        addUserMessageToConversation,
        initializeAssistantMessage,
        isStreaming: false,
        setIsStreaming,
        statusMessages,
        isCrossDatasetModeOn: false,
        token: 'token',
        handleInvalidStreaming,
        ...overrides,
      } as any),
    );
  }

  it('streams a new user message and saves the finalized conversation', async () => {
    const { result } = renderStreamingHook({
      isCrossDatasetModeOn: true,
    });

    await act(async () => {
      await result.current.sendMessageToConversation(
        'What changed?',
        conversation as any,
      );
    });

    expect(addUserMessageToConversation).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'msg-1000',
        role: Role.User,
        content: 'What changed?',
      }),
    );
    expect(streamChatResponse).toHaveBeenCalledWith(
      'bucket/en/conversation',
      [
        { role: Role.User, content: 'Previous' },
        { role: Role.User, content: 'What changed?' },
      ],
      expect.objectContaining({
        model: { id: 'model-id' },
      }),
      'token',
      {
        configuration: {
          language: 'en',
          merge_python_code: true,
          timezone: 'Europe/Prague',
        },
      },
    );
    expect(saveConversation).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [
          conversation.messages[0],
          expect.objectContaining({
            id: 'msg-1000',
            content: 'What changed?',
          }),
          expect.objectContaining({
            id: 'assistant-message',
            content: 'Answer',
            responseId: 'response-id',
          }),
        ],
        updatedAt: 1000,
      }),
    );
    expect(setIsStreaming).toHaveBeenNthCalledWith(1, true);
    expect(setIsStreaming).toHaveBeenLastCalledWith(false);
  });

  it('does not start a new stream while another stream is active', async () => {
    const { result } = renderStreamingHook({
      isStreaming: true,
    });

    await act(async () => {
      await result.current.sendMessageToConversation(
        'Second question',
        conversation as any,
      );
    });

    expect(addUserMessageToConversation).not.toHaveBeenCalled();
    expect(streamChatResponse).not.toHaveBeenCalled();
    expect(saveConversation).not.toHaveBeenCalled();
  });

  it('saves an assistant error message when streaming fails', async () => {
    const streamingError = {
      isHttpError: true,
      status: 503,
      message: 'Service unavailable',
    };
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    streamChatResponse.mockRejectedValueOnce(streamingError);

    const { result } = renderStreamingHook();

    await act(async () => {
      await result.current.sendMessageToConversation(
        'What changed?',
        conversation as any,
      );
    });

    expect(updateAssistantMessage).toHaveBeenCalledWith(
      { id: 'assistant-message', role: Role.Assistant, content: '' },
      { errorMessage: 'Server overloaded' },
    );
    expect(handleInvalidStreaming).toHaveBeenCalledWith(streamingError);
    expect(saveConversation).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({
            id: 'assistant-message',
            errorMessage: 'Server overloaded',
          }),
        ]),
      }),
    );

    consoleError.mockRestore();
  });
});
