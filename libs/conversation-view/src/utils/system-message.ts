import { Message, Role } from '@epam/ai-dial-shared';
import { AttachmentType } from '@epam/statgpt-dial-toolkit';
import { DataQuery, QueryFilter } from '@epam/statgpt-shared-toolkit';
import { getLastAssistantMessage } from './messages';

export const prepareSystemMessage = (
  filters: QueryFilter[],
  currentDataQuery?: DataQuery,
  dataQueries?: DataQuery[],
  message?: Message,
): Message => {
  const jsonAttachments =
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
    })) ?? [];

  const markdownAttachments =
    message?.custom_content?.attachments?.filter(
      (a) => a.type === AttachmentType.MARKDOWN,
    ) ?? [];

  return {
    role: Role.System,
    content: '',
    custom_content: {
      attachments: [...jsonAttachments, ...markdownAttachments],
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
