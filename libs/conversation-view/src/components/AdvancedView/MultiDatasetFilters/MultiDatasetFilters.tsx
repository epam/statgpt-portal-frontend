'use client';

import { DataConstraints } from '@epam/statgpt-sdmx-toolkit';
import { DataQuery, Locale } from '@epam/statgpt-shared-toolkit';
import { Popup, PopUpSize, PopUpState } from '@epam/statgpt-ui-components';
import { Filter, FiltersProps } from '../../../models/filters';
import {
  getFiltersAfterClear,
  getFiltersAfterDelete,
  getFilterIdentity,
  getSelectedFilterValues,
  getTotalSelectedValuesLength,
  isSameFilter,
  updateFiltersWithDisabledOption,
  updateFiltersWithDisplayMode,
  updateFiltersWithSelectedItem,
} from '../../../utils/filters';
import {
  FC,
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { updateMessagesWithSystemMessage } from '../../../utils/system-message';
import { getUpdatedDataQueries } from '../../../utils/get-updated-data-queries';
import FilterButton from '../Filters/FilterButton/FilterButton';
import FilterSettings from '../Filters/FiltersModal/FiltersSettings';
import ModalFooter from '../Filters/FiltersModal/ModalFooter';
import {
  buildFiltersMap,
  getCompatibleDatasetUrns,
  getConstraintsMapFromSettledResults,
  getConstraintsRequests,
  getFilledDatasetFiltersMap,
  getFiltersByConstraints,
  getFiltersPreselectedByDataQueries,
  hasUncachedConstraintRequests,
  isStructureDataMapsReady,
  getQueryFiltersMap,
  mergeConstraintsMaps,
  setDataQueryFiltersMap,
} from '../../../utils/multiple-filters';
import { getHierarchyRequestContextForFilter } from '../../../utils/hierarchy-request-context';
import { StructureDataMaps } from '../../../models/structure-data';
import { useHierarchyState } from '../../../utils/use-hierarchy-state';
import { useDatasetDimensionsMetadataMapOptional } from '../../../context/DatasetDimensionsMetadataMapContext';
import { useConversationViewStyles } from '../../../context/ConversationViewStylesContext';

const MultiDatasetFilters: FC<FiltersProps> = ({
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
}) => {
  const { titles } = useConversationViewStyles();
  const datasetDimensionsMetadata = useDatasetDimensionsMetadataMapOptional();
  const [modalState, setModalState] = useState(PopUpState.Closed);
  const [modalFilters, setModalFilters] = useState<Filter[]>([]);
  const [appliedFilters, setAppliedFilters] = useState<Filter[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<Filter>();
  const [selectedFilterValues, setSelectedFilterValues] = useState<Filter[]>(
    [],
  );
  const [selectedTimeOption, setSelectedTimeOption] = useState<
    string | number | undefined
  >(undefined);
  const constraintsMapRef = useRef<Map<string, DataConstraints[] | undefined>>(
    structureDataMaps?.constraintsMap,
  );
  const [initialModalConstraintsMap, setInitialModalConstraintsMap] =
    useState<Map<string, DataConstraints[] | undefined>>();
  const [isConstraintsLoading, setIsConstraintsLoading] = useState<boolean>();
  const [isDisableFilterValues, setIsDisableFilterValues] = useState<boolean>();
  const [isFilterValuesLoading, setIsFilterValuesLoading] = useState(false);
  const filterValuesLoadingRequestsRef = useRef(0);
  const [isModalClosed, setIsModalClosed] = useState(false);
  const [disabledDatasetUrns, setDisabledDatasetUrns] = useState<Set<string>>(
    new Set(),
  );

  const startFilterValuesLoading = useCallback(() => {
    filterValuesLoadingRequestsRef.current += 1;
    if (filterValuesLoadingRequestsRef.current === 1) {
      setIsFilterValuesLoading(true);
    }
  }, []);

  const finishFilterValuesLoading = useCallback(() => {
    filterValuesLoadingRequestsRef.current = Math.max(
      filterValuesLoadingRequestsRef.current - 1,
      0,
    );
    if (filterValuesLoadingRequestsRef.current === 0) {
      setIsFilterValuesLoading(false);
    }
  }, []);

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

  const updateSelectedFilterValues = (filter?: Filter) => {
    const filters = filter
      ? modalFilters.map((oldFilter) =>
          isSameFilter(oldFilter, filter) ? filter : oldFilter,
        )
      : modalFilters;

    setIsDisableFilterValues(true);
    setModalFilters(updateFiltersWithDisabledOption(filters));
    setIsConstraintsLoading?.(true);
    handleFiltersWithConstraints(
      filter?.isTimeDimension
        ? updateFiltersWithSelectedItem(filters, filter)
        : filters,
      setModalFilters,
      setIsConstraintsLoading,
      filter,
    );
  };

  useEffect(() => {
    if (modalState === PopUpState.Closed) {
      setInitialModalConstraintsMap(constraintsMapRef.current);
    }
  }, [modalState]);

  const handleFiltersWithConstraints = useCallback(
    (
      filters: Filter[],
      setFilters: (filters: Filter[]) => void,
      setIsConstraintsLoading?: (isLoading: boolean) => void,
      changedFilter?: Filter,
    ) => {
      const filtersMap = buildFiltersMap(
        filters,
        constraintsMapRef.current,
        false,
        datasetDimensionsMetadata.map,
      );
      const shouldTrackFilterValuesLoading = hasUncachedConstraintRequests(
        dataQueries,
        filtersMap,
        actions,
        datasetDimensionsMetadata.map,
        filters,
      );

      if (shouldTrackFilterValuesLoading) {
        startFilterValuesLoading();
      }

      const requests = getConstraintsRequests(
        dataQueries,
        filtersMap,
        actions,
        datasetDimensionsMetadata.map,
        filters,
      );

      Promise.allSettled(requests)
        .then((constraintsResults) => {
          const currentConstraintsMap = mergeConstraintsMaps(
            constraintsMapRef.current || structureDataMaps?.constraintsMap,
            getConstraintsMapFromSettledResults(constraintsResults),
          );
          const filledFilters = getFiltersByConstraints(
            filtersMap,
            { ...structureDataMaps, constraintsMap: currentConstraintsMap },
            locale as Locale,
            datasetDimensionsMetadata.map,
          );

          constraintsMapRef.current = currentConstraintsMap;
          setIsConstraintsLoading?.(false);
          setFilters(filledFilters);
          if (changedFilter) {
            const updatedSelectedFilter = filledFilters.find((filter) =>
              isSameFilter(filter, changedFilter),
            );

            setSelectedFilter((currentFilter) =>
              currentFilter &&
              updatedSelectedFilter &&
              isSameFilter(currentFilter, changedFilter)
                ? { ...updatedSelectedFilter, isSelectedFilter: true }
                : currentFilter,
            );
            rebuildHierarchyTree(
              changedFilter,
              getConstraintsForFilter(changedFilter),
            );
          }
        })
        .catch(() => {
          const currentConstraintsMap =
            constraintsMapRef.current ||
            structureDataMaps?.constraintsMap ||
            new Map();
          const filledFilters = getFiltersByConstraints(
            filtersMap,
            { ...structureDataMaps, constraintsMap: currentConstraintsMap },
            locale as Locale,
            datasetDimensionsMetadata.map,
          );

          constraintsMapRef.current = currentConstraintsMap;
          setIsConstraintsLoading?.(false);
          setFilters(filledFilters);
          if (changedFilter) {
            const updatedSelectedFilter = filledFilters.find((filter) =>
              isSameFilter(filter, changedFilter),
            );

            setSelectedFilter((currentFilter) =>
              currentFilter &&
              updatedSelectedFilter &&
              isSameFilter(currentFilter, changedFilter)
                ? { ...updatedSelectedFilter, isSelectedFilter: true }
                : currentFilter,
            );
          }
        })
        .finally(() => {
          setIsDisableFilterValues(false);
          if (shouldTrackFilterValuesLoading) {
            finishFilterValuesLoading();
          }
        });
    },
    [
      actions,
      dataQueries,
      datasetDimensionsMetadata.map,
      finishFilterValuesLoading,
      getConstraintsForFilter,
      locale,
      rebuildHierarchyTree,
      startFilterValuesLoading,
      structureDataMaps,
    ],
  );

  useEffect(() => {
    if (!isStructureDataReady) {
      setIsConstraintsLoading(true);
      return;
    }

    const filledDatasetFiltersMap = getFilledDatasetFiltersMap(
      structureDataMaps,
      locale,
    );
    const filtersFromDataQuery = getFiltersPreselectedByDataQueries(
      filledDatasetFiltersMap,
      dataQueries,
      structureDataMaps?.constraintsMap,
      datasetDimensionsMetadata.map,
    );
    setIsConstraintsLoading?.(true);
    handleFiltersWithConstraints(
      filtersFromDataQuery,
      setAppliedFilters,
      setIsConstraintsLoading,
    );
  }, [
    dataQueries,
    datasetDimensionsMetadata.map,
    handleFiltersWithConstraints,
    isStructureDataReady,
    locale,
    structureDataMaps,
  ]);

  useEffect(() => {
    if (appliedFilters?.length) {
      setSelectedFilterValues(getSelectedFilterValues(appliedFilters));
    }
  }, [appliedFilters]);

  useEffect(() => {
    setModalFilters((prevFilters) =>
      updateFiltersWithSelectedItem(prevFilters, selectedFilter),
    );
  }, [selectedFilter]);

  useEffect(() => {
    if (modalState === PopUpState.Opened) {
      setSelectedTimeOption(void 0);
      setSelectedFilter({ ...appliedFilters?.[0], isSelectedFilter: true });
      setModalFilters(appliedFilters);
      setDisabledDatasetUrns(
        new Set(dataQueries?.filter((q) => q.disabled).map((q) => q.urn)),
      );
    }
    if (modalState === PopUpState.Closed) {
      setSelectedFilter(void 0);
    }
  }, [appliedFilters, dataQueries, modalState]);

  // Load available hierarchies when selected filter changes
  useEffect(() => {
    if (!selectedFilter || selectedFilter.isTimeDimension) {
      return;
    }

    const filterKey = getFilterIdentity(selectedFilter);
    if (!filterKey) return;
    const existingState = hierarchyStateMap.get(filterKey);

    // Load once per unique filter — existingState being set (even isLoading:true)
    // means we've already initiated a request for this filter key
    if (!existingState) {
      loadAvailableHierarchies(selectedFilter);
    }
  }, [selectedFilter, hierarchyStateMap, loadAvailableHierarchies]);

  // Load hierarchies for all filters when modal opens
  useEffect(() => {
    if (modalState !== PopUpState.Opened) return;

    appliedFilters.forEach((filter) => {
      if (filter.isTimeDimension) return;
      const filterKey = getFilterIdentity(filter);
      if (filterKey && !hierarchyStateMap.has(filterKey)) {
        loadAvailableHierarchies(filter);
      }
    });
  }, [modalState, appliedFilters, hierarchyStateMap, loadAvailableHierarchies]);

  const addSystemMessage = useCallback(
    async (filtersMap: Map<string, Filter[]>) => {
      const updatedDataQueries = dataQueries?.map((q) =>
        disabledDatasetUrns.has(q.urn) ? { ...q, disabled: true as const } : q,
      );
      const dataQueryFiltersMap = setDataQueryFiltersMap(
        updatedDataQueries,
        filtersMap,
      );
      const updatedConversationWithSystemMessage = conversation
        ? {
            ...conversation,
            messages: updateMessagesWithSystemMessage(
              conversation?.messages,
              updatedDataQueries,
              dataQueryFiltersMap,
            ),
          }
        : null;

      setConversation?.(updatedConversationWithSystemMessage);

      updateDataQueries?.(
        getUpdatedDataQueries(updatedDataQueries, dataQueryFiltersMap),
      );

      await updateConversation(decodeURI(conversationKey), {
        name: updatedConversationWithSystemMessage?.name,
        messages: updatedConversationWithSystemMessage?.messages || [],
      });
    },
    [
      conversation,
      conversationKey,
      dataQueries,
      disabledDatasetUrns,
      setConversation,
      updateConversation,
      updateDataQueries,
    ],
  );

  const onSelectDisplayMode = useCallback(
    (filter?: Filter, displayMode?: string) => {
      setModalFilters((prevFilters) =>
        updateFiltersWithDisplayMode(prevFilters, filter, displayMode),
      );
      if (isSameFilter(selectedFilter, filter)) {
        setSelectedFilter((prevFilter) =>
          prevFilter
            ? {
                ...prevFilter,
                displayMode,
              }
            : prevFilter,
        );
      }
    },
    [selectedFilter],
  );

  const getFiltersChangeParamsMap = useCallback(
    (filtersMap: Map<string, Filter[]>) =>
      getQueryFiltersMap(
        filtersMap,
        dataQueries,
        structureDataMaps?.dimensionsMap,
      ),
    [dataQueries, structureDataMaps?.dimensionsMap],
  );

  const updateViewAfterDelete = useCallback(
    (
      filtersToUpdateMap: Map<string, Filter[]>,
      structureDataMaps?: StructureDataMaps,
    ) => {
      const filledFilters = getFiltersByConstraints(
        filtersToUpdateMap,
        structureDataMaps,
        locale as Locale,
        datasetDimensionsMetadata.map,
      );
      constraintsMapRef.current = structureDataMaps?.constraintsMap;

      setSelectedFilter(
        (previousSelectedFilter) =>
          filledFilters?.find((filter) =>
            isSameFilter(filter, previousSelectedFilter),
          ) || previousSelectedFilter,
      );
      setModalFilters(filledFilters);
      setIsDisableFilterValues(false);
    },
    [datasetDimensionsMetadata.map, locale],
  );

  const handleFiltersDelete = useCallback(
    (filtersToUpdate: Filter[], dataQueries?: DataQuery[]) => {
      setIsDisableFilterValues(true);
      setModalFilters(updateFiltersWithDisabledOption(filtersToUpdate));
      const filtersMap = buildFiltersMap(
        filtersToUpdate,
        constraintsMapRef.current,
        false,
        datasetDimensionsMetadata.map,
      );
      const currentConstraintsMap =
        constraintsMapRef.current ||
        structureDataMaps?.constraintsMap ||
        new Map<string, DataConstraints[] | undefined>();
      const shouldTrackFilterValuesLoading = hasUncachedConstraintRequests(
        dataQueries,
        filtersMap,
        actions,
        datasetDimensionsMetadata.map,
        filtersToUpdate,
      );

      if (shouldTrackFilterValuesLoading) {
        startFilterValuesLoading();
      }

      const requests = getConstraintsRequests(
        dataQueries,
        filtersMap,
        actions,
        datasetDimensionsMetadata.map,
        filtersToUpdate,
      );

      Promise.allSettled(requests)
        .then((constraintsResults) => {
          const mergedConstraintsMap = mergeConstraintsMaps(
            currentConstraintsMap,
            getConstraintsMapFromSettledResults(constraintsResults),
          );
          updateViewAfterDelete(filtersMap, {
            ...structureDataMaps,
            constraintsMap: mergedConstraintsMap,
          });
        })
        .catch(() => {
          updateViewAfterDelete(filtersMap, {
            ...structureDataMaps,
            constraintsMap: currentConstraintsMap,
          });
        })
        .finally(() => {
          if (shouldTrackFilterValuesLoading) {
            finishFilterValuesLoading();
          }
        });
    },
    [
      actions,
      datasetDimensionsMetadata.map,
      finishFilterValuesLoading,
      startFilterValuesLoading,
      structureDataMaps,
      updateViewAfterDelete,
    ],
  );

  const onDeleteFilter = useCallback(
    (filter?: Filter) => {
      const dataQuery = dataQueries?.find(
        (dataQuery) => dataQuery?.urn === filter?.datasetUrn,
      );
      const filtersAfterDelete = getFiltersAfterDelete(modalFilters, filter);

      handleFiltersDelete(
        filtersAfterDelete,
        !filter?.datasetUrn ? dataQueries : dataQuery ? [dataQuery] : [],
      );
    },
    [handleFiltersDelete, modalFilters, dataQueries],
  );

  const onToggleDataset = useCallback((urn: string, enabled: boolean) => {
    setDisabledDatasetUrns((prev) => {
      const next = new Set(prev);
      enabled ? next.delete(urn) : next.add(urn);
      return next;
    });
  }, []);

  const onCloseModal = useCallback(() => {
    constraintsMapRef.current = initialModalConstraintsMap;
    setModalState(PopUpState.Closed);
    setIsModalClosed(true);
  }, [initialModalConstraintsMap]);

  const onClearAllFilters = useCallback(() => {
    const filtersAfterClear = getFiltersAfterClear(modalFilters);

    handleFiltersDelete(filtersAfterClear, dataQueries);
    setDisabledDatasetUrns(new Set());
  }, [handleFiltersDelete, modalFilters, dataQueries, setDisabledDatasetUrns]);

  const onApply = useCallback(() => {
    const updatedDataQueries = dataQueries?.map((q) =>
      disabledDatasetUrns.has(q.urn) ? { ...q, disabled: true as const } : q,
    );
    const appliedFiltersMap = buildFiltersMap(
      modalFilters,
      constraintsMapRef.current,
      false,
      datasetDimensionsMetadata.map,
    );
    const appliedFilters = getFiltersByConstraints(
      appliedFiltersMap,
      {
        ...structureDataMaps,
        constraintsMap: constraintsMapRef.current,
      },
      locale as Locale,
      datasetDimensionsMetadata.map,
    );
    const filtersParamsMap = getFiltersChangeParamsMap(appliedFiltersMap);
    const compatibleUrns = getCompatibleDatasetUrns(
      modalFilters,
      dataQueries?.map((q) => q.urn) ?? [],
      dataQueries,
      datasetDimensionsMetadata.map,
      appliedFiltersMap,
    );

    const incompatibleUrns = (dataQueries?.map((q) => q.urn) ?? []).filter(
      (urn) => !compatibleUrns.has(urn),
    );
    for (const urn of incompatibleUrns) {
      const filters = appliedFiltersMap.get(urn);
      if (filters) {
        appliedFiltersMap.set(
          urn,
          filters.map((filter) =>
            !filter.isTimeDimension &&
            filter.dimensionValues?.length &&
            !filter.dimensionValues.some((v) => v.isSelectedValue)
              ? { ...filter, isExcluded: true }
              : filter,
          ),
        );
      }
    }

    onMultipleDataFiltersChange?.(
      filtersParamsMap,
      constraintsMapRef.current,
      updatedDataQueries?.filter(
        (q) => compatibleUrns.has(q.urn) || q.disabled,
      ),
      appliedFiltersMap,
      appliedFilters,
    );

    setAppliedFilters(appliedFilters);
    setModalState(PopUpState.Closed);
    setIsModalClosed(true);

    startTransition(() => {
      addSystemMessage(appliedFiltersMap);
    });
  }, [
    getFiltersChangeParamsMap,
    modalFilters,
    structureDataMaps,
    locale,
    datasetDimensionsMetadata.map,
    onMultipleDataFiltersChange,
    dataQueries,
    disabledDatasetUrns,
    addSystemMessage,
  ]);

  const onTimePeriodChange = (value: string | number) => {
    setSelectedTimeOption(value);
  };

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
      />
      <>
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
              locale={locale}
              timeRangeOptions={timeRangeOptions}
              filtersList={modalFilters}
              selectedFilter={selectedFilter}
              isDisableValues={isDisableFilterValues}
              isValuesLoading={isFilterValuesLoading}
              modalProps={modalProps}
              initialConstraintsMap={structureDataMaps?.constraintsMap}
              datasetIcon={datasetIcon}
              structuresMap={structureDataMaps?.structuresMap}
              setSelectedFilter={setSelectedFilter}
              onSelectDisplayMode={onSelectDisplayMode}
              onDeleteFilter={onDeleteFilter}
              onClearAllFilters={onClearAllFilters}
              updateSelectedFilterValues={updateSelectedFilterValues}
              onTimePeriodChange={onTimePeriodChange}
              selectedTimeOption={selectedTimeOption}
              hierarchyStateMap={hierarchyStateMap}
              onSelectHierarchy={onSelectHierarchy}
              onExpandHierarchyNode={onExpandHierarchyNode}
              dataQueries={dataQueries}
              disabledDatasetUrns={disabledDatasetUrns}
              onToggleDataset={onToggleDataset}
              onClearAllDatasets={() => setDisabledDatasetUrns(new Set())}
            />
            <ModalFooter
              onApply={onApply}
              onClose={onCloseModal}
              onClearAllFilters={onClearAllFilters}
              modalProps={modalProps}
              applyDisabled={isConstraintsLoading || isDisableFilterValues}
              limitMessages={limitMessages}
            />
          </Popup>
        )}
      </>
    </div>
  );
};

export default MultiDatasetFilters;
