'use client';

import { useEffect } from 'react';
import { Filter } from '../../../../models/filters';

type SetFilters = (filters: Filter[]) => void;
type SetBooleanLoading = (isLoading: boolean) => void;

/**
 * Outcome of a mode's initialization check:
 * - `ready`   — preselect now with `filters`;
 * - `pending` — structure data not ready yet, show loading and wait;
 * - `skip`    — nothing to do (e.g. already initialized, or no structure).
 */
export type FilterInitResult =
  | { status: 'ready'; filters: Filter[] }
  | { status: 'pending' }
  | { status: 'skip' };

/**
 * Mode-specific initialization behavior injected into the shared
 * {@link useFilterInitialization} skeleton. `prepareInit` computes the preselected
 * filters (or signals pending/skip); `markInitialized` lets a one-shot mode
 * (single-dataset) record that it has run.
 */
export interface FilterInitStrategy {
  prepareInit: () => FilterInitResult;
  markInitialized?: () => void;
}

interface UseFilterInitializationParams {
  init: FilterInitStrategy;
  setAppliedFilters: SetFilters;
  setIsConstraintsLoading: SetBooleanLoading;
  handleFiltersWithConstraints: (
    filters: Filter[],
    setFilters: SetFilters,
    setLoading?: SetBooleanLoading,
  ) => void;
}

/**
 * Shared initial preselect for both filter modes. Re-runs whenever the mode's
 * `prepareInit` identity changes (i.e., its inputs change); the mode decides via
 * the returned status whether to preselect, wait, or skip.
 */
export const useFilterInitialization = ({
  init,
  setAppliedFilters,
  setIsConstraintsLoading,
  handleFiltersWithConstraints,
}: UseFilterInitializationParams) => {
  const { prepareInit, markInitialized } = init;

  useEffect(() => {
    const result = prepareInit();

    if (result.status === 'pending') {
      setIsConstraintsLoading(true);
      return;
    }
    if (result.status === 'skip') {
      return;
    }

    setIsConstraintsLoading(true);
    handleFiltersWithConstraints(
      result.filters,
      setAppliedFilters,
      setIsConstraintsLoading,
    );
    markInitialized?.();
  }, [
    prepareInit,
    markInitialized,
    setAppliedFilters,
    setIsConstraintsLoading,
    handleFiltersWithConstraints,
  ]);
};
