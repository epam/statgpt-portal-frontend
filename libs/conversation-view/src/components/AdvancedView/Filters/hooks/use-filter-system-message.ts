'use client';

import type { Conversation } from '@epam/ai-dial-shared';
import { DataQuery } from '@epam/statgpt-shared-toolkit';
import { useCallback, useEffect, useRef } from 'react';
import { FiltersProps } from '../../../../models/filters';
import { SystemMessageFilters } from './use-filter-apply';

/**
 * Mode-specific system-message builder injected into the shared
 * {@link useFilterSystemMessage} skeleton. Given the current conversation and the
 * applied filters, it returns the conversation updated with the new system message
 * (or `null` when there is no conversation) plus the data queries to persist. The
 * single-dataset flow works on a flat `Filter[]`; the multi-dataset flow works on
 * a per-dataset map and additionally folds in `disabledDatasetUrns`.
 */
export interface FilterSystemMessageStrategy {
  buildSystemMessage: (
    conversation: Conversation | null,
    systemMessageFilters: SystemMessageFilters,
    disabledDatasetUrns: Set<string>,
  ) => { conversation: Conversation | null; nextDataQueries: DataQuery[] };
}

interface UseFilterSystemMessageParams {
  buildSystemMessage: FilterSystemMessageStrategy['buildSystemMessage'];
  conversation?: FiltersProps['conversation'];
  conversationKey: string;
  setConversation?: FiltersProps['setConversation'];
  updateConversation: FiltersProps['updateConversation'];
  updateDataQueries?: FiltersProps['updateDataQueries'];
}

/**
 * Shared system-message persistence for both filter modes: snapshot the current
 * conversation off a ref, delegate message + data-query construction to the
 * mode-specific `buildSystemMessage`, then persist the result (local conversation
 * state, data queries, and the remote conversation). No per-mode branching lives
 * here — all of it is encapsulated in `buildSystemMessage`.
 */
export const useFilterSystemMessage = ({
  buildSystemMessage,
  conversation,
  conversationKey,
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
      systemMessageFilters: SystemMessageFilters,
      disabledDatasetUrns?: Set<string>,
    ) => {
      const { conversation: updatedConversation, nextDataQueries } =
        buildSystemMessage(
          conversationRef.current ?? null,
          systemMessageFilters,
          disabledDatasetUrns ?? new Set<string>(),
        );

      setConversation?.(updatedConversation);
      updateDataQueries?.(nextDataQueries);

      await updateConversation(decodeURI(conversationKey), {
        name: updatedConversation?.name,
        messages: updatedConversation?.messages || [],
      });
    },
    [
      buildSystemMessage,
      conversationKey,
      setConversation,
      updateConversation,
      updateDataQueries,
    ],
  );
};
