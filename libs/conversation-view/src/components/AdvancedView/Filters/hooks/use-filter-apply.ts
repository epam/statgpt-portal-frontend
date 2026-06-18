'use client';

import { startTransition, useCallback, useMemo } from 'react';
import { Filter } from '../../../../models/filters';

/** Filters passed to the system message: flat (single) or per-dataset (multi). */
export type SystemMessageFilters = Filter[] | Map<string, Filter[]>;

/**
 * Mode-specific apply behavior injected into the shared {@link useFilterApply}
 * skeleton. `runApply` performs the mode's `onFiltersChange` side effect and
 * returns the next applied filters plus the filters to persist on the system
 * message; `getIsFiltersUnchanged` powers the Apply-disabled state.
 */
export interface FilterApplyStrategy {
  getIsFiltersUnchanged: (
    modalFilters: Filter[],
    appliedFilters: Filter[],
    disabledDatasetUrns: Set<string>,
    appliedDisabledUrns: Set<string>,
  ) => boolean;
  runApply: (
    modalFilters: Filter[],
    disabledDatasetUrns: Set<string>,
  ) => { appliedFilters: Filter[]; systemMessageFilters: SystemMessageFilters };
}

interface UseFilterApplyParams {
  apply: FilterApplyStrategy;
  modalFilters: Filter[];
  appliedFilters: Filter[];
  disabledDatasetUrns: Set<string>;
  appliedDisabledUrns: Set<string>;
  setAppliedFilters: (filters: Filter[]) => void;
  closeModal: () => void;
  addSystemMessage: (
    filters: SystemMessageFilters,
    disabledDatasetUrns: Set<string>,
  ) => Promise<void>;
}

/**
 * Shared apply control flow for both filter modes: compute the unchanged state,
 * and on apply run the mode-specific change, persist applied filters, close the
 * modal and write the system message off the render path.
 */
export const useFilterApply = ({
  apply,
  modalFilters,
  appliedFilters,
  disabledDatasetUrns,
  appliedDisabledUrns,
  setAppliedFilters,
  closeModal,
  addSystemMessage,
}: UseFilterApplyParams) => {
  const isFiltersUnchanged = useMemo(
    () =>
      apply.getIsFiltersUnchanged(
        modalFilters,
        appliedFilters,
        disabledDatasetUrns,
        appliedDisabledUrns,
      ),
    [
      apply,
      modalFilters,
      appliedFilters,
      disabledDatasetUrns,
      appliedDisabledUrns,
    ],
  );

  const onApply = useCallback(() => {
    const { appliedFilters: nextAppliedFilters, systemMessageFilters } =
      apply.runApply(modalFilters, disabledDatasetUrns);

    setAppliedFilters(nextAppliedFilters);
    closeModal();

    startTransition(() => {
      addSystemMessage(systemMessageFilters, disabledDatasetUrns);
    });
  }, [
    apply,
    modalFilters,
    disabledDatasetUrns,
    setAppliedFilters,
    closeModal,
    addSystemMessage,
  ]);

  return { isFiltersUnchanged, onApply };
};
