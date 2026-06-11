import { Attachment, Message, Role } from '@epam/ai-dial-shared';
import { AttachmentType } from '@epam/statgpt-dial-toolkit';
import { DataQuery, QueryFilter } from '@epam/statgpt-shared-toolkit';
import { getLastAssistantMessage } from './messages';

const isPythonAttachment = (attachment: Attachment): boolean =>
  attachment.type === 'text/markdown' &&
  !!attachment.data?.includes('```python');

/**
 * Collects the python code-sample attachments to carry onto a rebuilt system message.
 *
 * The original per-dataset samples live on the assistant response; subsequent Applies
 * persist updated versions on the system message. The assistant originals form the base
 * set, and the system message's samples overlay them — keyed by title, which embeds the
 * dataset urn — so updated versions win and no dataset's sample is dropped.
 */
const collectCarriedPythonAttachments = (
  assistantMessage?: Message,
  systemMessage?: Message,
): Attachment[] => {
  const assistantPython =
    assistantMessage?.custom_content?.attachments?.filter(isPythonAttachment) ??
    [];
  const systemPython =
    systemMessage?.custom_content?.attachments?.filter(isPythonAttachment) ??
    [];
  const pythonByKey = new Map<string, Attachment>();
  for (const attachment of [...assistantPython, ...systemPython]) {
    pythonByKey.set(attachment.title ?? attachment.data ?? '', attachment);
  }
  return [...pythonByKey.values()];
};

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
              disabled: !!dataQuery?.disabled,
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

  const lastMessage = messages.at(-1);
  const isLastSystem = lastMessage?.role === Role.System;

  const baseMessages = isLastSystem ? messages.slice(0, -1) : messages;
  const lastAssistantMessage = getLastAssistantMessage(baseMessages);

  const pythonAttachments = collectCarriedPythonAttachments(
    lastAssistantMessage,
    isLastSystem ? lastMessage : undefined,
  );

  const newSystemMessage = prepareSystemMessage(
    filters,
    currentDataQuery,
    dataQueries,
    lastAssistantMessage,
    queryFiltersMap,
  );

  if (pythonAttachments.length && newSystemMessage.custom_content) {
    newSystemMessage.custom_content = {
      ...newSystemMessage.custom_content,
      attachments: [
        ...(newSystemMessage.custom_content.attachments ?? []),
        ...pythonAttachments,
      ],
    };
  }

  return [...baseMessages, newSystemMessage];
};
