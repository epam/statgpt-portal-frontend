'use client';

import { useCallback, useEffect, useRef } from 'react';
import { Filter, FilterMode, FiltersProps } from '../../../../models/filters';
import { getUpdatedDataQueries } from '../../../../utils/get-updated-data-queries';
import { setDataQueryFiltersMap } from '../../../../utils/multiple-filters';
import { setDataQueryFilters } from '../../../../utils/query-filters';
import { updateMessagesWithSystemMessage } from '../../../../utils/system-message';

interface UseFilterSystemMessageParams {
  mode: FilterMode;
  attachmentsDataQuery?: FiltersProps['attachmentsDataQuery'];
  conversation?: FiltersProps['conversation'];
  conversationKey: string;
  dataQueries?: FiltersProps['dataQueries'];
  setConversation?: FiltersProps['setConversation'];
  updateConversation: FiltersProps['updateConversation'];
  updateDataQueries?: FiltersProps['updateDataQueries'];
}

export const useFilterSystemMessage = ({
  mode,
  attachmentsDataQuery,
  conversation,
  conversationKey,
  dataQueries,
  setConversation,
  updateConversation,
  updateDataQueries,
}: UseFilterSystemMessageParams) => {
  const conversationRef = useRef(conversation);

  useEffect(() => {
    conversationRef.current = conversation;
  }, [conversation]);

  return useCallback(
    async (
      filtersOrMap: Filter[] | Map<string, Filter[]>,
      disabledDatasetUrns?: Set<string>,
    ) => {
      const currentConversation = conversationRef.current;
      let updatedConversationWithSystemMessage = currentConversation ?? null;

      if (mode === 'multi') {
        const filtersMap = filtersOrMap as Map<string, Filter[]>;
        const disabledUrns = disabledDatasetUrns ?? new Set<string>();
        const updatedDataQueries = dataQueries?.map((q) => ({
          ...q,
          disabled: disabledUrns.has(q.urn),
        }));
        const enabledDataQueries = updatedDataQueries?.filter(
          (q) => !q.disabled,
        );
        const dataQueryFiltersMap = setDataQueryFiltersMap(
          enabledDataQueries,
          filtersMap,
        );
        updatedConversationWithSystemMessage = currentConversation
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
      } else {
        const filters = filtersOrMap as Filter[];
        const dataQueryFilters = setDataQueryFilters(filters);
        updatedConversationWithSystemMessage = currentConversation
          ? {
              ...currentConversation,
              messages: updateMessagesWithSystemMessage(
                currentConversation.messages,
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
      }

      await updateConversation(decodeURI(conversationKey), {
        name: updatedConversationWithSystemMessage?.name,
        messages: updatedConversationWithSystemMessage?.messages || [],
      });
    },
    [
      mode,
      attachmentsDataQuery,
      conversationKey,
      dataQueries,
      setConversation,
      updateConversation,
      updateDataQueries,
    ],
  );
};
