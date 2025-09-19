import { Message, Role } from '@epam/ai-dial-shared';
import { AttachmentType } from '@statgpt/dial-toolkit/src/types/attachment-type';
import {
  DataQuery,
  QueryFilter,
} from '@statgpt/shared-toolkit/src/models/data-query';

export const prepareSystemMessage = (
  filters: QueryFilter[],
  currentDataQuery?: DataQuery,
): Message => {
  return {
    role: Role.System,
    content: '',
    custom_content: {
      attachments: [
        {
          type: AttachmentType.JSON,
          title: currentDataQuery?.title,
          data: JSON.stringify({
            urn: currentDataQuery?.urn,
            metadata: currentDataQuery?.metadata,
            filters,
          }),
        },
      ],
    },
  } as Message;
};

export const updateMessagesWithSystemMessage = (
  messages: Message[],
  filters: QueryFilter[],
  currentDataQuery?: DataQuery,
): Message[] => {
  if (!messages) {
    return [];
  }

  const lastMessage = messages?.at(-1);

  if (lastMessage && lastMessage.role === Role.System) {
    messages?.pop();
  }

  return [...messages, prepareSystemMessage(filters, currentDataQuery)];
};
