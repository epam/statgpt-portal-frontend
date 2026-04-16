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
  getConstraintsMap,
  getConstraintsRequests,
  getFilledDatasetFiltersMap,
  getFiltersByConstraints,
  getFiltersPreselectedByDataQueries,
  isStructureDataMapsReady,
  getQueryFiltersMap,
  setDataQueryFiltersMap,
} from '../../../utils/multiple-filters';
import { getHierarchyRequestContextForFilter } from '../../../utils/hierarchy-request-context';
import { StructureDataMaps } from '../../../models/structure-data';
import { useHierarchyState } from '../../../utils/use-hierarchy-state';

const MultiDatasetFilters: FC<FiltersProps> = ({
  actions,
  structureDataMaps,
  buttonProps,
  modalProps,
  dataQueries,
  onMultipleDataFiltersChange,
  locale,
  timeRangeOptions,
  titles,
  datasetIcon,
  conversationKey,
  conversation,
  setConversation,
  updateConversation,
  updateDataQueries,
  limitMessages,
  filterIconClassName,
}) => {
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
  const [isModalClosed, setIsModalClosed] = useState(false);

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
        true,
      );

      Promise.all(getConstraintsRequests(dataQueries, filtersMap, actions))
        .then((constraintsData) => {
          const currentConstraintsMap = getConstraintsMap(constraintsData);
          constraintsMapRef.current = currentConstraintsMap;
          setIsConstraintsLoading?.(false);
          setFilters(
            getFiltersByConstraints(
              filtersMap,
              { ...structureDataMaps, constraintsMap: currentConstraintsMap },
              locale as Locale,
            ),
          );
          if (changedFilter) {
            rebuildHierarchyTree(
              changedFilter,
              getConstraintsForFilter(changedFilter),
            );
          }
        })
        .catch(() => {
          const currentConstraintsMap = new Map();
          constraintsMapRef.current = currentConstraintsMap;
          setIsConstraintsLoading?.(false);
          setFilters(
            getFiltersByConstraints(
              filtersMap,
              { ...structureDataMaps, constraintsMap: currentConstraintsMap },
              locale as Locale,
            ),
          );
        })
        .finally(() => {
          setIsDisableFilterValues(false);
        });
    },
    [
      actions,
      dataQueries,
      getConstraintsForFilter,
      locale,
      rebuildHierarchyTree,
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
    );
    setIsConstraintsLoading?.(true);
    handleFiltersWithConstraints(
      filtersFromDataQuery,
      setAppliedFilters,
      setIsConstraintsLoading,
    );
  }, [
    dataQueries,
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
    }
    if (modalState === PopUpState.Closed) {
      setSelectedFilter(void 0);
    }
  }, [appliedFilters, modalState]);

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
      const dataQueryFiltersMap = setDataQueryFiltersMap(
        dataQueries,
        filtersMap,
      );
      const updatedConversationWithSystemMessage = conversation
        ? {
            ...conversation,
            messages: updateMessagesWithSystemMessage(
              conversation?.messages,
              dataQueries,
              dataQueryFiltersMap,
            ),
          }
        : null;

      setConversation?.(updatedConversationWithSystemMessage);

      updateDataQueries?.(
        getUpdatedDataQueries(dataQueries, dataQueryFiltersMap),
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
    [locale],
  );

  const handleFiltersDelete = useCallback(
    (filtersToUpdate: Filter[], dataQueries?: DataQuery[]) => {
      setIsDisableFilterValues(true);
      setModalFilters(updateFiltersWithDisabledOption(filtersToUpdate));
      const filtersMap = buildFiltersMap(
        filtersToUpdate,
        constraintsMapRef.current,
        true,
      );

      Promise.all(getConstraintsRequests(dataQueries, filtersMap, actions))
        .then((constraintsData) => {
          updateViewAfterDelete(filtersMap, {
            ...structureDataMaps,
            constraintsMap: getConstraintsMap(constraintsData),
          });
        })
        .catch(() => {
          updateViewAfterDelete(filtersMap, {
            ...structureDataMaps,
            constraintsMap: new Map(),
          });
        });
    },
    [actions, structureDataMaps, updateViewAfterDelete],
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

  const onCloseModal = useCallback(() => {
    constraintsMapRef.current = initialModalConstraintsMap;
    setModalState(PopUpState.Closed);
    setIsModalClosed(true);
  }, [initialModalConstraintsMap]);

  const onClearAllFilters = useCallback(() => {
    const filtersAfterClear = getFiltersAfterClear(modalFilters);

    handleFiltersDelete(filtersAfterClear, dataQueries);
  }, [handleFiltersDelete, modalFilters, dataQueries]);

  const onApply = useCallback(() => {
    const appliedFiltersMap = buildFiltersMap(
      modalFilters,
      constraintsMapRef.current,
      true,
    );
    const appliedFilters = getFiltersByConstraints(
      appliedFiltersMap,
      {
        ...structureDataMaps,
        constraintsMap: constraintsMapRef.current,
      },
      locale as Locale,
    );
    const filtersParamsMap = getFiltersChangeParamsMap(appliedFiltersMap);
    onMultipleDataFiltersChange?.(
      filtersParamsMap,
      constraintsMapRef.current,
      dataQueries,
    );

    setAppliedFilters(appliedFilters);
    setModalState(PopUpState.Closed);
    setIsModalClosed(true);

    startTransition(() => {
      addSystemMessage(
        buildFiltersMap(modalFilters, constraintsMapRef.current, true),
      );
    });
  }, [
    getFiltersChangeParamsMap,
    modalFilters,
    structureDataMaps,
    locale,
    onMultipleDataFiltersChange,
    dataQueries,
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
        titles={titles}
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
              titles={titles}
              timeRangeOptions={timeRangeOptions}
              filtersList={modalFilters}
              selectedFilter={selectedFilter}
              isDisableValues={isDisableFilterValues}
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
            />
            <ModalFooter
              titles={titles}
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
