import { Message, Role } from '@epam/ai-dial-shared';
import { AttachmentType } from '@statgpt/dial-toolkit/src/types/attachment-type';
import {
  DataQuery,
  QueryFilter,
} from '@statgpt/shared-toolkit/src/models/data-query';
import { getLastAssistantMessage } from './messages';

export const prepareSystemMessage = (
  filters: QueryFilter[],
  currentDataQuery?: DataQuery,
  dataQueries?: DataQuery[],
  message?: Message,
): Message => {
  return {
    role: Role.System,
    content: '',
    custom_content: {
      attachments:
        dataQueries?.map((dataQuery) => ({
          type: AttachmentType.JSON,
          title: dataQuery?.title,
          data: JSON.stringify({
            urn: dataQuery?.urn,
            metadata: dataQuery?.metadata,
            filters:
              currentDataQuery?.urn === dataQuery?.urn
                ? filters
                : dataQuery?.filters,
          }),
        })) || [],
      form_schema: message?.custom_content?.form_schema,
    },
  } as Message;
};

export const updateMessagesWithSystemMessage = (
  messages: Message[],
  filters: QueryFilter[],
  currentDataQuery?: DataQuery,
  dataQueries?: DataQuery[],
): Message[] => {
  if (!messages) {
    return [];
  }

  const lastMessage = messages?.at(-1);

  if (lastMessage && lastMessage.role === Role.System) {
    messages?.pop();
  }

  return [
    ...messages,
    prepareSystemMessage(
      filters,
      currentDataQuery,
      dataQueries,
      getLastAssistantMessage(messages),
    ),
  ];
};
