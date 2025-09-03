import { MessageStreamResponse } from '@statgpt/dial-toolkit/src/models/chat-stream';

const extractTokenFromResponse = (
  data: MessageStreamResponse,
): string | null => {
  if (data.content) {
    console.info(`Using direct content format: ${data.content}`);
    return data.content;
  }

  if (data.choices?.[0]?.delta?.content) {
    console.info(`Using OpenAI delta format: ${data.choices[0].delta.content}`);
    return data.choices[0].delta.content;
  }

  if (data.choices?.[0]?.message?.content) {
    console.info(
      `Using complete message format:  ${data.choices[0].message.content}`,
    );
    return data.choices[0].message.content;
  }

  console.info('Unknown SSE data format:', data);
  return null;
};

export const handleStreamMessage = (
  data: MessageStreamResponse,
  onMessage?: (data: MessageStreamResponse) => void,
  onToken?: (token: string) => void,
) => {
  console.info('Chat SSE message received:', data);

  onMessage?.(data);

  if (onToken) {
    const token = extractTokenFromResponse(data);
    if (token) {
      onToken(token);
    }
  }
};
