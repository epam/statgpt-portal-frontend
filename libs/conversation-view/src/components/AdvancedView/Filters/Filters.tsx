'use client';

import {
  DataConstraints,
  getTimeSeriesCount,
} from '@epam/statgpt-sdmx-toolkit';
import { Popup, PopUpSize, PopUpState } from '@epam/statgpt-ui-components';
import isEqual from 'lodash/isEqual';
import {
  FC,
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { useConversationViewStyles } from '../../../context/ConversationViewStylesContext';
import { useFiltersModalState } from '../../../context/FiltersModalStateContext';
import { Filter, FiltersProps } from '../../../models/filters';
import {
  getFiltersAfterClear,
  getFiltersAfterDelete,
  getTotalSelectedValuesLength,
} from '../../../utils/filters';
import { getSourceArtefactUrnForDatasetFilter } from '../../../utils/hierarchy-request-context';
import { getQueryFilters } from '../../../utils/query-filters';
import { getCodelistUrnForDatasetFilter } from '../../../utils/single-dataset-filters';
import { useHierarchyState } from '../../../utils/use-hierarchy-state';
import FilterButton from './FilterButton/FilterButton';
import FilterSettings from './FiltersModal/FiltersSettings';
import ModalFooter from './FiltersModal/ModalFooter';
import { useSingleDatasetFilterConstraints } from './hooks/use-single-dataset-filter-constraints';
import { useSingleDatasetFilterInitialization } from './hooks/use-single-dataset-filter-initialization';
import { useSingleDatasetFilterModalState } from './hooks/use-single-dataset-filter-modal-state';
import { useSingleDatasetSystemMessage } from './hooks/use-single-dataset-system-message';

const EMPTY_DISABLED_DATASETS = new Set<string>();
const noopToggleDataset = () => {};
const noopClearAllDatasets = () => {};

const Filters: FC<FiltersProps> = ({
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
}) => {
  const { titles } = useConversationViewStyles();
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
    onSelectDisplayMode,
    onTimePeriodChange,
  } = useSingleDatasetFilterModalState({
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

  const addSystemMessage = useSingleDatasetSystemMessage({
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

  return (
    <div className="filters-container">
      <FilterButton
        buttonProps={buttonProps}
        selectedFiltersCount={getTotalSelectedValuesLength(
          selectedFilterValues,
        )}
        isLoading={isConstraintsLoading}
        setModalState={setModalState}
        isModalClosed={isModalClosed}
        warningIcon={limitMessages?.warningIcon}
        filterIconClassName={filterIconClassName}
        timeSeriesCount={timeSeriesCount}
      />
      {modalState === PopUpState.Opened && (
        <Popup
          heading={titles?.settings || 'Settings'}
          portalId="filters"
          size={PopUpSize.LG}
          containerClassName="advanced-view-filters-modal h-[80%]"
          dividers={modalProps?.isShowDividers}
          onClose={onCloseModal}
          closeButtonTitle={titles?.close || 'Close'}
        >
          <FilterSettings
            controller={{
              state: {
                filtersList: modalFilters,
                selectedFilter,
                isDisableValues: isDisableFilterValues,
                isValuesLoading: isFilterValuesLoading,
                selectedTimeOption,
                disabledDatasetUrns: EMPTY_DISABLED_DATASETS,
                timeSeriesCount: `${timeSeriesCount}`,
              },
              options: {
                locale,
                timeRangeOptions,
                modalProps,
                initialConstraints,
                dataQueries: attachmentsDataQuery
                  ? [attachmentsDataQuery]
                  : undefined,
              },
              handlers: {
                setSelectedFilter,
                onSelectDisplayMode,
                onDeleteFilter,
                onClearAllFilters,
                updateSelectedFilterValues,
                onTimePeriodChange,
                onToggleDataset: noopToggleDataset,
                onClearAllDatasets: noopClearAllDatasets,
              },
              hierarchy: {
                hierarchyStateMap,
                onSelectHierarchy,
                onExpandHierarchyNode,
              },
            }}
          />
          <ModalFooter
            onApply={onApply}
            onClose={onCloseModal}
            onClearAllFilters={onClearAllFilters}
            modalProps={modalProps}
            applyDisabled={isApplyDisabled}
            timeseriesLength={timeSeriesCount}
            limitMessages={limitMessages}
          />
        </Popup>
      )}
    </div>
  );
};

export default Filters;
