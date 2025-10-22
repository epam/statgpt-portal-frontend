import { Conversation, Role } from '@epam/ai-dial-shared';
import { Message } from '@epam/statgpt-dial-toolkit';
import { Attachment } from '@epam/ai-dial-shared/src/types/chat';

export const transformMessagesForApi = (
  userMessage: Message,
  conversation: Conversation | null,
) => transformMessages([...(conversation?.messages || []), userMessage]);

export const transformMessages = (messages: Message[]) =>
  [...messages].map((msg) => {
    const transformedMsg: Message = {
      role: msg.role,
      content: msg.content,
    };

    if (
      (msg.role === Role.Assistant || msg.role === Role.System) &&
      msg.custom_content != null &&
      (msg.custom_content.state != null ||
        msg.custom_content.attachments != null ||
        msg.custom_content.form_schema != null)
    ) {
      transformedMsg.custom_content = {};
      if (msg.custom_content.state != null) {
        transformedMsg.custom_content.state = msg.custom_content.state;
      }
      if (msg.custom_content.attachments != null) {
        transformedMsg.custom_content.attachments = transformAttachmentsForApi(
          msg.custom_content.attachments,
        );
      }
      if (msg.custom_content.form_schema != null) {
        transformedMsg.custom_content.form_schema =
          msg.custom_content.form_schema;
      }
    }
    if (msg.role === Role.User && msg.custom_content) {
      transformedMsg.custom_content = msg.custom_content;
    }
    return transformedMsg;
  });

export const transformRegenerateMessage = (
  userMessage: Message,
  conversation: Conversation | null,
) => {
  const messages = conversation?.messages;

  const index = messages?.findIndex(
    (message) => userMessage.id === (message as Message).id,
  );

  return transformMessages(messages?.slice(0, index) || []);
};

export const transformEditMessage = (
  userMessage: Message,
  conversation: Conversation | null,
) => {
  const messages = conversation?.messages;

  const index = messages?.findIndex(
    (message) => userMessage.id === (message as Message).id,
  );

  return transformMessages([...(messages?.slice(0, index) || []), userMessage]);
};

function transformAttachmentsForApi(attachments: Attachment[]): Attachment[] {
  return attachments.map((attachment) => ({
    type: attachment.type,
    title: attachment.title,
    data: attachment.data,
    url: attachment.url,
    reference_type: attachment.reference_type,
    reference_url: attachment.reference_url,
  }));
}
