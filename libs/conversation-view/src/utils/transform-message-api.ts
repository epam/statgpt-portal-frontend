import { Conversation, Role } from '@epam/ai-dial-shared';
import { Message } from '@statgpt/dial-toolkit/src/models/message';
import { Attachment } from '@epam/ai-dial-shared/src/types/chat';

export const transformMessagesForApi = (
  userMessage: Message,
  conversation: Conversation | null,
) => {
  return [...(conversation?.messages || []), userMessage].map((msg) => {
    const transformedMsg: Message = {
      role: msg.role,
      content: msg.content,
    };

    if (
      msg.role === Role.Assistant &&
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
    return transformedMsg;
  });
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
