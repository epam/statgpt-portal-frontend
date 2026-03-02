/**
 * SSE (Server-Sent Events) client for handling streaming chat responses
 *
 * Provides a robust client for consuming server-sent events from chat APIs,
 * with support for multiple message formats (OpenAI delta, direct content),
 * error handling, and streaming lifecycle management.
 */
import { Message } from '../models/message';
import {
  API_ROUTES,
  getHeaders,
  HttpError,
} from '@epam/statgpt-shared-toolkit';
import {
  CustomFields,
  MessageStreamResponse,
  RequestStreamBody,
} from '../models/chat-stream';
import { ModelInfo } from '../models/model';
import { handleStreamMessage } from '../utils/chat-stream-api';
import { sendRequest } from '../utils/send-request';

interface SSEOptions {
  signal?: AbortSignal;
  onMessage?: (data: MessageStreamResponse) => void;
  onError?: (error: Error) => void;
  onComplete?: () => void;
}

export class ChatStreamSSEClient {
  private decoder = new TextDecoder();

  async streamChat(
    url: string,
    body: RequestStreamBody,
    options: SSEOptions = {},
    token?: string,
  ): Promise<void> {
    const { onMessage, onError, onComplete, signal } = options;

    try {
      const reader = await this.initializeStreamRequest(
        url,
        body,
        signal,
        token,
      );
      await this.processStreamData(reader, onMessage);
      onComplete?.();
    } catch (error) {
      this.handleStreamError(error, onError);
    }
  }

  private async initializeStreamRequest(
    url: string,
    body: RequestStreamBody,
    signal?: AbortSignal,
    jwt?: string,
  ): Promise<ReadableStreamDefaultReader<Uint8Array>> {
    const reqHeaders = getHeaders(void 0, {
      jwt,
    });
    const response = await sendRequest(
      url,
      {
        Accept: 'text/event-stream',
        ...reqHeaders,
      },
      {
        method: 'POST',
        body,
        signal,
      },
    );

    if (!response.ok) {
      const errorResponse = await response.text();
      let errorObject: { error?: string } = {};
      try {
        errorObject = JSON.parse(errorResponse);
      } catch {
        errorObject.error = 'Failed to parse error body';
      }

      throw new HttpError({
        status: response.status,
        message: errorObject.error ?? 'No response body',
      });
    }

    if (!response.body) {
      throw new HttpError({
        message: 'No response body',
        status: response.status,
      });
    }

    return response.body.getReader();
  }

  private async processStreamData(
    reader: ReadableStreamDefaultReader<Uint8Array>,
    onMessage?: (data: MessageStreamResponse) => void,
  ): Promise<void> {
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          if (buffer.trim()) {
            this.parseSSEDataLine(buffer, onMessage);
          }
          break;
        }

        const chunk = this.decoder.decode(value, { stream: true });
        buffer += chunk;

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          this.parseSSEDataLine(line, onMessage);
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  private handleStreamError(error: unknown, onError?: (error: Error) => void) {
    const streamError =
      error instanceof Error ? error : new Error(String(error));
    onError?.(streamError);
    throw streamError;
  }

  private parseSSEDataLine(
    line: string,
    onMessage?: (data: MessageStreamResponse) => void,
  ) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith(':')) {
      return;
    }

    if (trimmedLine.startsWith('data: ')) {
      const data = trimmedLine.slice(6);

      if (data === '[DONE]') {
        console.info('SSE: Stream completed');
        return;
      }

      try {
        const parsed = JSON.parse(data);
        onMessage?.(parsed);
      } catch (error) {
        console.error(`Failed to parse SSE data: ${data} ${error}`);
      }
    }
  }
}

export const chatStreamSSEClient = new ChatStreamSSEClient();

export const streamChatResponse = async (
  conversationId: string,
  messages: Message[],
  options: {
    onMessage?: (data: MessageStreamResponse) => void;
    onToken?: (token: string) => void;
    onComplete?: () => void;
    onError?: (error: Error) => void;
    model: ModelInfo;
    signal?: AbortSignal;
  },
  token?: string | null,
  custom_fields?: CustomFields,
): Promise<void> => {
  const { onMessage, onToken, onComplete, onError, model, signal } = options;
  const requestBody: RequestStreamBody = {
    conversationId,
    messages,
    model,
    custom_fields,
  };

  await chatStreamSSEClient.streamChat(
    API_ROUTES.CHAT,
    requestBody,
    {
      onMessage: (data) => handleStreamMessage(data, onMessage, onToken),
      onComplete,
      onError,
      signal,
    },
    token as string,
  );
};
