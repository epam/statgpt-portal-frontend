'use client';

import { useCallback, useEffect, useRef } from 'react';
import { Filter, FiltersProps } from '../../../../models/filters';
import { setDataQueryFiltersMap } from '../../../../utils/multiple-filters';
import { updateMessagesWithSystemMessage } from '../../../../utils/system-message';

interface UseMultiDatasetSystemMessageParams {
  conversation?: FiltersProps['conversation'];
  conversationKey: string;
  dataQueries?: FiltersProps['dataQueries'];
  setConversation?: FiltersProps['setConversation'];
  updateConversation: FiltersProps['updateConversation'];
  updateDataQueries?: FiltersProps['updateDataQueries'];
}

export const useMultiDatasetSystemMessage = ({
  conversation,
  conversationKey,
  dataQueries,
  setConversation,
  updateConversation,
  updateDataQueries,
}: UseMultiDatasetSystemMessageParams) => {
  const conversationRef = useRef(conversation);

  useEffect(() => {
    conversationRef.current = conversation;
  }, [conversation]);

  return useCallback(
    async (
      filtersMap: Map<string, Filter[]>,
      disabledDatasetUrns: Set<string>,
    ) => {
      const currentConversation = conversationRef.current;
      const updatedDataQueries = dataQueries?.map((q) => ({
        ...q,
        disabled: disabledDatasetUrns.has(q.urn),
      }));
      const enabledDataQueries = updatedDataQueries?.filter((q) => !q.disabled);
      const dataQueryFiltersMap = setDataQueryFiltersMap(
        enabledDataQueries,
        filtersMap,
      );
      const updatedConversationWithSystemMessage = currentConversation
        ? {
            ...currentConversation,
            messages: updateMessagesWithSystemMessage(
              currentConversation.messages,
              updatedDataQueries,
              dataQueryFiltersMap,
            ),
          }
        : null;

      setConversation?.(updatedConversationWithSystemMessage);

      updateDataQueries?.(
        updatedDataQueries?.map((q) => ({
          ...q,
          filters: q.disabled
            ? (q.filters ?? [])
            : (dataQueryFiltersMap.get(q.urn) ?? []),
        })) ?? [],
      );

      await updateConversation(decodeURI(conversationKey), {
        name: updatedConversationWithSystemMessage?.name,
        messages: updatedConversationWithSystemMessage?.messages || [],
      });
    },
    [
      conversationKey,
      dataQueries,
      setConversation,
      updateConversation,
      updateDataQueries,
    ],
  );
};
