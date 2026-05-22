import { Message, Role } from '@epam/ai-dial-shared';
import { AttachmentType } from '@epam/statgpt-dial-toolkit';
import { DataQuery, QueryFilter } from '@epam/statgpt-shared-toolkit';
import { getLastAssistantMessage } from './messages';

export const prepareSystemMessage = (
  filters?: QueryFilter[],
  currentDataQuery?: DataQuery,
  dataQueries?: DataQuery[],
  message?: Message,
  queryFiltersMap?: Map<string, QueryFilter[]>,
): Message => {
  return {
    role: Role.System,
    content: '',
    custom_content: {
      attachments:
        dataQueries?.map((dataQuery) => {
          const singleDataQueryFilters =
            filters && currentDataQuery?.urn === dataQuery?.urn
              ? filters
              : dataQuery?.filters;
          return {
            type: AttachmentType.JSON,
            title: dataQuery?.title,
            data: JSON.stringify({
              urn: dataQuery?.urn,
              metadata: dataQuery?.metadata,
              filters: queryFiltersMap
                ? queryFiltersMap?.get(dataQuery?.urn)
                : singleDataQueryFilters,
              ...(dataQuery?.disabled ? { disabled: true } : {}),
            }),
          };
        }) || [],
      form_schema: message?.custom_content?.form_schema,
    },
  } as Message;
};

export const updateMessagesWithSystemMessage = (
  messages: Message[],
  dataQueries?: DataQuery[],
  queryFiltersMap?: Map<string, QueryFilter[]>,
  filters?: QueryFilter[],
  currentDataQuery?: DataQuery,
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
      queryFiltersMap,
    ),
  ];
};
