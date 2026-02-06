import { AuthParams } from './../../../models/auth';
import { NextRequest, NextResponse } from 'next/server';
import { conversationApi } from '../api';
import { chatLogger } from '../../../core/logger';
import { withAuth } from '../../../utils/auth/withAuth';

// Enable streaming for this route
export const runtime = 'nodejs';

export const POST = withAuth(
  async (request: NextRequest, { token }: AuthParams) => {
    try {
      const body = await request.json();
      const { conversationId, messages, model } = body;

      chatLogger.info('Chat request received', {
        conversationId,
        messageCount: messages?.length,
        model: model?.id,
      });

      // Stream response from DIAL API
      const dialStream = await conversationApi.streamChat(
        {
          conversationId,
          messages,
          model,
        },
        token?.access_token as string,
      );

      // Convert DIAL stream to SSE format
      // DIAL API uses null-byte delimited chunks, not SSE format
      const sseStream = new ReadableStream({
        start(controller) {
          const reader = dialStream.getReader();
          const decoder = new TextDecoder();
          let eventData = '';

          const pump = async () => {
            try {
              while (true) {
                const { done, value } = await reader.read();

                if (done) {
                  chatLogger.info('Stream completed');
                  // Send final SSE message
                  controller.enqueue(
                    new TextEncoder().encode('data: [DONE]\n\n'),
                  );
                  controller.close();
                  return;
                }

                const decodedValue = decoder.decode(value, { stream: true });

                eventData += decodedValue;

                // Try different parsing strategies

                // Strategy 1: DIAL format with null byte delimiters
                if (eventData.includes('\0')) {
                  try {
                    const chunks = eventData
                      .split('\0')
                      .filter((chunk) => chunk.trim());
                    const lastChunk = eventData.endsWith('\0')
                      ? ''
                      : chunks.pop() || '';

                    for (const chunk of chunks) {
                      if (chunk.trim()) {
                        try {
                          const parsed = JSON.parse(chunk);
                          const sseData = JSON.stringify(parsed);
                          controller.enqueue(
                            new TextEncoder().encode(`data: ${sseData}\n\n`),
                          );
                        } catch (parseErr) {
                          chatLogger.warn(
                            'Failed to parse null-delimited chunk',
                            { chunk: chunk.substring(0, 100), error: parseErr },
                          );
                        }
                      }
                    }

                    eventData = lastChunk;
                    continue;
                  } catch (error) {
                    chatLogger.warn('Error processing null-delimited chunks', {
                      error,
                    });
                  }
                }

                // Strategy 2: Standard SSE format (data: lines)
                const lines = eventData.split('\n');
                const lastLine = lines.pop() || '';

                for (const line of lines) {
                  const trimmed = line.trim();
                  if (trimmed.startsWith('data: ')) {
                    const data = trimmed.slice(6);
                    if (data === '[DONE]') {
                      controller.enqueue(
                        new TextEncoder().encode('data: [DONE]\n\n'),
                      );
                      controller.close();
                      return;
                    }
                    try {
                      controller.enqueue(
                        new TextEncoder().encode(`data: ${data}\n\n`),
                      );
                    } catch (parseErr) {
                      chatLogger.warn('Failed to parse SSE chunk', {
                        data: data.substring(0, 100),
                        error: parseErr,
                      });
                    }
                  } else if (trimmed) {
                    // Strategy 3: Raw JSON objects
                    try {
                      const parsed = JSON.parse(trimmed);
                      const sseData = JSON.stringify(parsed);
                      controller.enqueue(
                        new TextEncoder().encode(`data: ${sseData}\n\n`),
                      );
                    } catch (parseErr) {
                      chatLogger.warn('Failed to parse raw JSON chunk', {
                        line: trimmed.substring(0, 100),
                        error: parseErr,
                      });
                    }
                  }
                }

                eventData = lastLine;
              }
            } catch (streamError) {
              chatLogger.error('Stream error', { error: streamError });
              controller.error(streamError);
            }
          };

          pump();
        },
      });

      return new NextResponse(sseStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    } catch (error) {
      chatLogger.error('Chat API error', { error });
      return NextResponse.json(
        { error: 'Failed to process chat request' },
        { status: 500 },
      );
    }
  },
);
