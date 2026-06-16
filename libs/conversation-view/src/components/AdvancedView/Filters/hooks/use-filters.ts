'use client';

import { DataConstraints } from '@epam/statgpt-sdmx-toolkit';
import { DataQuery } from '@epam/statgpt-shared-toolkit';
import { PopUpState } from '@epam/statgpt-ui-components';
import { useCallback, useEffect } from 'react';
import { useFiltersModalState } from '../../../../context/FiltersModalStateContext';
import { Filter, FilterMode, FiltersProps } from '../../../../models/filters';
import {
  getFiltersAfterClear,
  getFiltersAfterDelete,
  getTotalSelectedValuesLength,
} from '../../../../utils/filters';
import { useHierarchyState } from '../../../../utils/use-hierarchy-state';
import { FilterSettingsOptions } from '../FiltersModal/filter-settings-controller';
import { FiltersModalShellProps } from '../FiltersModal/FiltersModalShell';
import { FilterApplyStrategy, useFilterApply } from './use-filter-apply';
import {
  FilterConstraintsStrategy,
  useFilterConstraints,
} from './use-filter-constraints';
import {
  FilterInitStrategy,
  useFilterInitialization,
} from './use-filter-initialization';
import { useFilterModalState } from './use-filter-modal-state';
import { useFilterSystemMessage } from './use-filter-system-message';

/**
 * Everything mode-specific about a filter flow, bundled behind one object so the
 * shared {@link useFilters} orchestration stays mode-agnostic. Built per mode by
 * `useSingleFilterStrategy` / `useMultiFilterStrategy`.
 */
export interface FilterStrategy<TResult> {
  mode: FilterMode;
  /** Constraint operations consumed by the shared constraints skeleton. */
  constraints: FilterConstraintsStrategy<TResult>;
  /** Apply operations consumed by the shared apply skeleton. */
  apply: FilterApplyStrategy;
  /** Initialization behavior consumed by the shared init skeleton. */
  init: FilterInitStrategy;
  getConstraintsForFilter: (filter: Filter) => DataConstraints[] | undefined;
  getCodelistUrnForFilter: (filter: Filter) => string | undefined;
  getSourceArtefactUrn: (filter: Filter) => string | undefined;
  remember: () => void;
  restore: () => void;
  /** Data queries whose constraints to refresh when a single filter is deleted. */
  getDeleteTargets: (
    filter: Filter | undefined,
    dataQueries?: DataQuery[],
  ) => DataQuery[] | undefined;
  /** Data queries whose constraints to refresh when all filters are cleared. */
  getClearTargets: (dataQueries?: DataQuery[]) => DataQuery[] | undefined;
  /** Mode-specific `FilterSettings` options (merged with the common ones). */
  controllerOptions: Partial<FilterSettingsOptions>;
  /** Total timeseries count (single-dataset only). */
  timeSeriesCount?: number;
}

/**
 * Shared orchestration for both filter modes: wires hierarchy, modal state,
 * constraint fetching, initialization, system-message persistence and apply,
 * then assembles the `FiltersModalShell` props. All mode-specific behavior is
 * provided by `strategy`, so this hook contains no per-mode branching beyond a
 * couple of tiny gates keyed on `strategy.mode`.
 */
export const useFilters = <TResult>(
  {
    actions,
    buttonProps,
    modalProps,
    attachmentsDataQuery,
    dataQueries,
    locale,
    timeRangeOptions,
    conversationKey,
    conversation,
    setConversation,
    updateConversation,
    updateDataQueries,
    limitMessages,
    filterIconClassName,
  }: FiltersProps,
  strategy: FilterStrategy<TResult>,
): FiltersModalShellProps => {
  const {
    mode,
    constraints,
    apply,
    init,
    getConstraintsForFilter,
    getCodelistUrnForFilter,
    getSourceArtefactUrn,
    remember,
    restore,
    getDeleteTargets,
    getClearTargets,
    controllerOptions,
    timeSeriesCount,
  } = strategy;

  const { modalState, setModalState, isModalClosed, setIsModalClosed } =
    useFiltersModalState();

  const {
    hierarchyStateMap,
    rebuildHierarchyTree,
    loadAvailableHierarchies,
    onSelectHierarchy,
    onExpandHierarchyNode,
  } = useHierarchyState({
    getCodelistUrnForFilter,
    getConstraintsForFilter,
    getSourceArtefactUrn,
    getAvailableHierarchies: actions?.getAvailableHierarchies,
    getHierarchy: actions?.getHierarchy,
  });

  const {
    modalFilters,
    setModalFilters,
    appliedFilters,
    setAppliedFilters,
    selectedFilter,
    setSelectedFilter,
    selectedFilterValues,
    selectedTimeOption,
    disabledDatasetUrns,
    appliedDisabledUrns,
    onSelectDisplayMode,
    onClearAllDatasets,
    onToggleDataset,
    onTimePeriodChange,
  } = useFilterModalState({
    mode,
    modalState,
    // Multi seeds disabled-dataset state from dataQueries on open; single must
    // not key its open effect on dataQueries — it would drop in-progress edits
    // if the conversation's queries changed while the modal is open.
    dataQueries: mode === 'multi' ? dataQueries : undefined,
    hierarchyStateMap,
    loadAvailableHierarchies,
  });

  const {
    isConstraintsLoading,
    isDisableFilterValues,
    isFilterValuesLoading,
    setIsConstraintsLoading,
    handleFiltersWithConstraints,
    handleFiltersDelete,
    updateSelectedFilterValues,
  } = useFilterConstraints({
    strategy: constraints,
    modalFilters,
    setModalFilters,
    setSelectedFilter,
    rebuildHierarchyTree,
  });

  useEffect(() => {
    if (modalState === PopUpState.Closed) {
      remember();
    }
  }, [modalState, remember]);

  useFilterInitialization({
    init,
    setAppliedFilters,
    setIsConstraintsLoading,
    handleFiltersWithConstraints,
  });

  const closeModal = useCallback(() => {
    setModalState(PopUpState.Closed);
    setIsModalClosed(true);
  }, [setModalState, setIsModalClosed]);

  const onCloseModal = useCallback(() => {
    restore();
    closeModal();
  }, [closeModal, restore]);

  const addSystemMessage = useFilterSystemMessage({
    mode,
    attachmentsDataQuery,
    conversation,
    conversationKey,
    dataQueries,
    setConversation,
    updateConversation,
    updateDataQueries,
  });

  const { isFiltersUnchanged, onApply } = useFilterApply({
    apply,
    modalFilters,
    appliedFilters,
    disabledDatasetUrns,
    appliedDisabledUrns,
    setAppliedFilters,
    closeModal,
    addSystemMessage,
  });

  const onDeleteFilter = useCallback(
    (filter?: Filter) => {
      handleFiltersDelete(
        getFiltersAfterDelete(modalFilters, filter),
        getDeleteTargets(filter, dataQueries),
      );
    },
    [dataQueries, getDeleteTargets, handleFiltersDelete, modalFilters],
  );

  const onClearAllFilters = useCallback(() => {
    handleFiltersDelete(
      getFiltersAfterClear(modalFilters),
      getClearTargets(dataQueries),
    );
    // "Clear all" also re-enables every dataset in multi; no-op concept in single.
    if (mode === 'multi') {
      onClearAllDatasets();
    }
  }, [
    dataQueries,
    getClearTargets,
    handleFiltersDelete,
    mode,
    modalFilters,
    onClearAllDatasets,
  ]);

  const isApplyDisabled =
    isConstraintsLoading || isDisableFilterValues || isFiltersUnchanged;

  return {
    buttonProps,
    selectedFiltersCount: getTotalSelectedValuesLength(selectedFilterValues),
    isLoading: isConstraintsLoading,
    setModalState,
    isModalClosed,
    filterIconClassName,
    timeSeriesCount,
    modalState,
    modalProps,
    onApply,
    onClose: onCloseModal,
    onClearAllFilters,
    applyDisabled: isApplyDisabled,
    limitMessages,
    controller: {
      state: {
        filtersList: modalFilters,
        selectedFilter,
        isDisableValues: isDisableFilterValues,
        isValuesLoading: isFilterValuesLoading,
        selectedTimeOption,
        disabledDatasetUrns,
        timeSeriesCount:
          timeSeriesCount === undefined ? undefined : `${timeSeriesCount}`,
      },
      options: {
        locale,
        timeRangeOptions,
        modalProps,
        ...controllerOptions,
      },
      handlers: {
        setSelectedFilter,
        onSelectDisplayMode,
        onDeleteFilter,
        onClearAllFilters,
        updateSelectedFilterValues,
        onTimePeriodChange,
        onToggleDataset,
        onClearAllDatasets,
      },
      hierarchy: {
        hierarchyStateMap,
        onSelectHierarchy,
        onExpandHierarchyNode,
      },
    },
  };
};
