'use client';

import { useCallback } from 'react';
import { Filter, FiltersProps } from '../../../../models/filters';
import { getUpdatedDataQueries } from '../../../../utils/get-updated-data-queries';
import { setDataQueryFilters } from '../../../../utils/query-filters';
import { updateMessagesWithSystemMessage } from '../../../../utils/system-message';

interface UseSingleDatasetSystemMessageParams {
  attachmentsDataQuery?: FiltersProps['attachmentsDataQuery'];
  conversation?: FiltersProps['conversation'];
  conversationKey: string;
  dataQueries?: FiltersProps['dataQueries'];
  setConversation?: FiltersProps['setConversation'];
  updateConversation: FiltersProps['updateConversation'];
  updateDataQueries?: FiltersProps['updateDataQueries'];
}

export const useSingleDatasetSystemMessage = ({
  attachmentsDataQuery,
  conversation,
  conversationKey,
  dataQueries,
  setConversation,
  updateConversation,
  updateDataQueries,
}: UseSingleDatasetSystemMessageParams) =>
  useCallback(
    async (filters: Filter[]) => {
      const dataQueryFilters = setDataQueryFilters(filters);
      const updatedConversationWithSystemMessage = conversation
        ? {
            ...conversation,
            messages: updateMessagesWithSystemMessage(
              conversation?.messages,
              dataQueries,
              void 0,
              dataQueryFilters,
              attachmentsDataQuery,
            ),
          }
        : null;

      setConversation?.(updatedConversationWithSystemMessage);

      updateDataQueries?.(
        getUpdatedDataQueries(
          dataQueries,
          void 0,
          dataQueryFilters,
          attachmentsDataQuery,
        ),
      );

      await updateConversation(decodeURI(conversationKey), {
        name: updatedConversationWithSystemMessage?.name,
        messages: updatedConversationWithSystemMessage?.messages || [],
      });
    },
    [
      attachmentsDataQuery,
      conversation,
      conversationKey,
      dataQueries,
      setConversation,
      updateConversation,
      updateDataQueries,
    ],
  );
