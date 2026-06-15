'use client';

import {
  DataConstraints,
  getTimeSeriesCount,
} from '@epam/statgpt-sdmx-toolkit';
import { PopUpState } from '@epam/statgpt-ui-components';
import isEqual from 'lodash/isEqual';
import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { useFiltersModalState } from '../../../../context/FiltersModalStateContext';
import { Filter, FiltersProps } from '../../../../models/filters';
import {
  getFiltersAfterClear,
  getFiltersAfterDelete,
  getTotalSelectedValuesLength,
} from '../../../../utils/filters';
import { getSourceArtefactUrnForDatasetFilter } from '../../../../utils/hierarchy-request-context';
import { getQueryFilters } from '../../../../utils/query-filters';
import { getCodelistUrnForDatasetFilter } from '../../../../utils/single-dataset-filters';
import { useHierarchyState } from '../../../../utils/use-hierarchy-state';
import { FiltersModalShellProps } from '../FiltersModal/FiltersModalShell';
import { useFilterModalState } from './use-filter-modal-state';
import { useFilterSystemMessage } from './use-filter-system-message';
import { useSingleDatasetFilterConstraints } from './use-single-dataset-filter-constraints';
import { useSingleDatasetFilterInitialization } from './use-single-dataset-filter-initialization';

export const useSingleDatasetFilters = ({
  actions,
  dimensions,
  structureDimensions,
  structures,
  buttonProps,
  modalProps,
  attachmentsDataQuery,
  dataQueries,
  initialConstraints,
  onFiltersChange,
  locale,
  timeRangeOptions,
  conversationKey,
  conversation,
  setConversation,
  updateConversation,
  updateDataQueries,
  limitMessages,
  filterIconClassName,
}: FiltersProps): FiltersModalShellProps => {
  const { modalState, setModalState, isModalClosed, setIsModalClosed } =
    useFiltersModalState();
  const constraintsRef = useRef<DataConstraints[]>(initialConstraints || []);

  const getCodelistUrnForFilter = useCallback(
    (filter: Filter): string | undefined =>
      getCodelistUrnForDatasetFilter(filter, dimensions, structures),
    [dimensions, structures],
  );

  const {
    hierarchyStateMap,
    rebuildHierarchyTree,
    loadAvailableHierarchies,
    onSelectHierarchy,
    onExpandHierarchyNode,
  } = useHierarchyState({
    getCodelistUrnForFilter,
    getConstraintsForFilter: () => constraintsRef.current,
    getSourceArtefactUrn: (filter) =>
      getSourceArtefactUrnForDatasetFilter(filter.id, structures),
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
    onSelectDisplayMode,
    onClearAllDatasets,
    onToggleDataset,
    onTimePeriodChange,
  } = useFilterModalState({
    mode: 'single',
    modalState,
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
    rememberInitialModalConstraints,
    restoreInitialModalConstraints,
  } = useSingleDatasetFilterConstraints({
    actions,
    attachmentUrn: attachmentsDataQuery?.urn,
    dimensions,
    structures,
    constraintsRef,
    locale,
    modalFilters,
    setModalFilters,
    setSelectedFilter,
    rebuildHierarchyTree,
  });

  useEffect(() => {
    if (modalState === PopUpState.Closed) {
      rememberInitialModalConstraints();
    }
  }, [modalState, rememberInitialModalConstraints]);

  useSingleDatasetFilterInitialization({
    dimensions,
    structureDimensions,
    structures,
    attachmentsDataQuery,
    locale,
    constraintsRef,
    setAppliedFilters,
    setIsConstraintsLoading,
    handleFiltersWithConstraints,
  });

  const addSystemMessage = useFilterSystemMessage({
    mode: 'single',
    attachmentsDataQuery,
    conversation,
    conversationKey,
    dataQueries,
    setConversation,
    updateConversation,
    updateDataQueries,
  });

  const getFiltersChangeParams = useCallback(
    (filters: Filter[]) => getQueryFilters(filters, dimensions),
    [dimensions],
  );

  const isFiltersUnchanged = useMemo(
    () =>
      isEqual(
        getFiltersChangeParams(modalFilters),
        getFiltersChangeParams(appliedFilters),
      ),
    [modalFilters, appliedFilters, getFiltersChangeParams],
  );

  const onDeleteFilter = useCallback(
    (filter?: Filter) => {
      handleFiltersDelete(getFiltersAfterDelete(modalFilters, filter));
    },
    [handleFiltersDelete, modalFilters],
  );

  const onClearAllFilters = useCallback(() => {
    handleFiltersDelete(getFiltersAfterClear(modalFilters));
  }, [handleFiltersDelete, modalFilters]);

  const onCloseModal = useCallback(() => {
    restoreInitialModalConstraints();
    setModalState(PopUpState.Closed);
    setIsModalClosed(true);
  }, [restoreInitialModalConstraints, setModalState, setIsModalClosed]);

  const onApply = useCallback(() => {
    const params = getFiltersChangeParams(modalFilters);
    onFiltersChange?.(params, constraintsRef.current, modalFilters);

    setAppliedFilters(modalFilters);
    setModalState(PopUpState.Closed);
    setIsModalClosed(true);

    startTransition(() => {
      addSystemMessage(modalFilters);
    });
  }, [
    addSystemMessage,
    getFiltersChangeParams,
    modalFilters,
    onFiltersChange,
    setAppliedFilters,
    setIsModalClosed,
    setModalState,
  ]);

  const timeSeriesCount = Number(
    getTimeSeriesCount(constraintsRef.current?.[0]?.annotations),
  );
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
        timeSeriesCount: `${timeSeriesCount}`,
      },
      options: {
        locale,
        timeRangeOptions,
        modalProps,
        initialConstraints,
        dataQueries: attachmentsDataQuery ? [attachmentsDataQuery] : undefined,
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
