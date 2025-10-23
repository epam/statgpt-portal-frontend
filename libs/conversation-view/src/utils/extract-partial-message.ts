import { Message, MessageStreamResponse } from '@epam/statgpt-dial-toolkit';

export const extractPartialMessageData = (data: MessageStreamResponse) => {
  const partialMessage: Partial<Message> = {};

  if (data.choices?.[0]?.delta?.content) {
    partialMessage.content = data.choices[0].delta.content;
  }

  if (data.choices?.[0]?.delta?.custom_content) {
    partialMessage.custom_content = data.choices[0].delta.custom_content;
  }

  if (data.choices?.[0]?.delta?.role) {
    partialMessage.role = data.choices[0].delta.role;
  }

  if (data.id) {
    partialMessage.responseId = data.id;
  }

  return partialMessage;
};
