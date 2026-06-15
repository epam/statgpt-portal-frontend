'use client';

import { DataConstraints } from '@epam/statgpt-sdmx-toolkit';
import { PopUpState } from '@epam/statgpt-ui-components';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useDatasetDimensionsMetadataMapOptional } from '../../../../context/DatasetDimensionsMetadataMapContext';
import { useFiltersModalState } from '../../../../context/FiltersModalStateContext';
import { Filter, FiltersProps } from '../../../../models/filters';
import {
  getFiltersAfterClear,
  getFiltersAfterDelete,
  getTotalSelectedValuesLength,
} from '../../../../utils/filters';
import { getHierarchyRequestContextForFilter } from '../../../../utils/hierarchy-request-context';
import { isStructureDataMapsReady } from '../../../../utils/multiple-filters';
import { useHierarchyState } from '../../../../utils/use-hierarchy-state';
import { FiltersModalShellProps } from '../../Filters/FiltersModal/FiltersModalShell';
import { useFilterModalState } from '../../Filters/hooks/use-filter-modal-state';
import { useFilterSystemMessage } from '../../Filters/hooks/use-filter-system-message';
import { useMultiDatasetDisplayDataQueries } from './use-multi-dataset-display-data-queries';
import { useMultiDatasetFilterApply } from './use-multi-dataset-filter-apply';
import { useMultiDatasetFilterConstraints } from './use-multi-dataset-filter-constraints';
import { useMultiDatasetFilterInitialization } from './use-multi-dataset-filter-initialization';

export const useMultiDatasetFilters = ({
  actions,
  structureDataMaps,
  buttonProps,
  modalProps,
  dataQueries,
  onMultipleDataFiltersChange,
  locale,
  timeRangeOptions,
  datasetIcon,
  conversationKey,
  conversation,
  setConversation,
  updateConversation,
  updateDataQueries,
  limitMessages,
  filterIconClassName,
}: FiltersProps): FiltersModalShellProps => {
  const datasetDimensionsMetadata = useDatasetDimensionsMetadataMapOptional();
  const { modalState, setModalState, isModalClosed, setIsModalClosed } =
    useFiltersModalState();
  const constraintsMapRef = useRef<
    Map<string, DataConstraints[] | undefined> | undefined
  >(structureDataMaps?.constraintsMap);

  const isStructureDataReady = useMemo(
    () => isStructureDataMapsReady(dataQueries, structureDataMaps),
    [dataQueries, structureDataMaps],
  );

  const getHierarchyRequestContext = useCallback(
    (filter: Filter) =>
      getHierarchyRequestContextForFilter(
        filter,
        structureDataMaps?.dimensionsMap,
        structureDataMaps?.structuresMap,
      ),
    [structureDataMaps?.dimensionsMap, structureDataMaps?.structuresMap],
  );

  const getCodelistUrnForFilter = useCallback(
    (filter: Filter) => getHierarchyRequestContext(filter).codelistUrn,
    [getHierarchyRequestContext],
  );

  const getConstraintsForFilter = useCallback((filter: Filter) => {
    const datasetUrn =
      filter.filterType === 'dataset'
        ? filter.datasetUrn
        : filter.sourceDatasetUrns?.[0];
    return datasetUrn ? constraintsMapRef.current?.get(datasetUrn) : undefined;
  }, []);

  const getSourceArtefactUrn = useCallback(
    (filter: Filter) => getHierarchyRequestContext(filter).sourceArtefactUrn,
    [getHierarchyRequestContext],
  );

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
    mode: 'multi',
    modalState,
    dataQueries,
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
    rememberInitialModalConstraintsMap,
    restoreInitialModalConstraintsMap,
  } = useMultiDatasetFilterConstraints({
    actions,
    dataQueries,
    datasetDimensionsMetadataMap: datasetDimensionsMetadata.map,
    structureDataMaps,
    constraintsMapRef,
    locale,
    modalFilters,
    setModalFilters,
    setSelectedFilter,
    rebuildHierarchyTree,
    getConstraintsForFilter,
  });

  useEffect(() => {
    if (modalState === PopUpState.Closed) {
      rememberInitialModalConstraintsMap();
    }
  }, [modalState, rememberInitialModalConstraintsMap]);

  useMultiDatasetFilterInitialization({
    dataQueries,
    datasetDimensionsMetadataMap: datasetDimensionsMetadata.map,
    isStructureDataReady,
    locale,
    structureDataMaps,
    setAppliedFilters,
    setIsConstraintsLoading,
    handleFiltersWithConstraints,
  });

  const closeModal = useCallback(() => {
    setModalState(PopUpState.Closed);
    setIsModalClosed(true);
  }, [setModalState, setIsModalClosed]);

  const onCloseModal = useCallback(() => {
    restoreInitialModalConstraintsMap();
    closeModal();
  }, [closeModal, restoreInitialModalConstraintsMap]);

  const addSystemMessage = useFilterSystemMessage({
    mode: 'multi',
    conversation,
    conversationKey,
    dataQueries,
    setConversation,
    updateConversation,
    updateDataQueries,
  });

  const { isFiltersUnchanged, onApply } = useMultiDatasetFilterApply({
    appliedDisabledUrns,
    appliedFilters,
    constraintsMapRef,
    dataQueries,
    datasetDimensionsMetadataMap: datasetDimensionsMetadata.map,
    disabledDatasetUrns,
    locale,
    modalFilters,
    onMultipleDataFiltersChange,
    setAppliedFilters,
    structureDataMaps,
    closeModal,
    addSystemMessage,
  });

  const onDeleteFilter = useCallback(
    (filter?: Filter) => {
      const dataQuery = dataQueries?.find(
        (dataQuery) => dataQuery?.urn === filter?.datasetUrn,
      );

      handleFiltersDelete(
        getFiltersAfterDelete(modalFilters, filter),
        !filter?.datasetUrn ? dataQueries : dataQuery ? [dataQuery] : [],
      );
    },
    [dataQueries, handleFiltersDelete, modalFilters],
  );

  const onClearAllFilters = useCallback(() => {
    handleFiltersDelete(getFiltersAfterClear(modalFilters), dataQueries);
    onClearAllDatasets();
  }, [dataQueries, handleFiltersDelete, modalFilters, onClearAllDatasets]);

  const displayDataQueries = useMultiDatasetDisplayDataQueries(
    dataQueries,
    structureDataMaps?.structuresMap,
    locale,
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
      },
      options: {
        locale,
        timeRangeOptions,
        modalProps,
        initialConstraintsMap: structureDataMaps?.constraintsMap,
        datasetIcon,
        structuresMap: structureDataMaps?.structuresMap,
        dataQueries: displayDataQueries,
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
