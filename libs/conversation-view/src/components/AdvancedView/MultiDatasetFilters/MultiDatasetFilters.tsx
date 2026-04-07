'use client';

import {
  CodelistData,
  DataConstraints,
  Hierarchy,
  StructuralMetaData,
  resolveCodelistsFromResponse,
} from '@epam/statgpt-sdmx-toolkit';
import { DataQuery, Locale } from '@epam/statgpt-shared-toolkit';
import { Popup, PopUpSize, PopUpState } from '@epam/statgpt-ui-components';
import { Filter, FiltersProps, HierarchyState } from '../../../models/filters';
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
  getCodelistUrnForFilter,
  getConstraintsMap,
  getConstraintsRequests,
  getFilledDatasetFiltersMap,
  getFiltersByConstraints,
  getFiltersPreselectedByDataQueries,
  isStructureDataMapsReady,
  getQueryFiltersMap,
  setDataQueryFiltersMap,
} from '../../../utils/multiple-filters';
import { StructureDataMaps } from '../../../models/structure-data';
import {
  buildHierarchyFilterTreeProps,
  buildHierarchyUrn,
  getLatestHierarchies,
  toggleTreeNodeExpansion,
} from '../../../utils/hierarchy-view';

const EMPTY_HIERARCHY_STATE: HierarchyState = {
  availableHierarchies: [],
  selectedHierarchy: null,
  mainHierarchy: null,
  codelists: [],
  treeNodes: [],
  isLoading: false,
};

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

  // Hierarchy state map: filterKey to HierarchyState
  const [hierarchyStateMap, setHierarchyStateMap] = useState<
    Map<string, HierarchyState>
  >(new Map());

  const isStructureDataReady = useMemo(
    () => isStructureDataMapsReady(dataQueries, structureDataMaps),
    [dataQueries, structureDataMaps],
  );

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

  const rebuildHierarchyTree = useCallback(
    (
      filter: Filter,
      currentConstraintsMap: Map<string, DataConstraints[] | undefined>,
    ) => {
      const filterKey = getFilterIdentity(filter);
      if (!filterKey) return;

      const codelistUrn = getCodelistUrnForFilter(
        filter,
        structureDataMaps?.dimensionsMap,
        structureDataMaps?.structuresMap,
      );
      const datasetUrn =
        filter.filterType === 'dataset'
          ? filter.datasetUrn
          : filter.sourceDatasetUrns?.[0];
      const constraints = datasetUrn
        ? currentConstraintsMap.get(datasetUrn)
        : undefined;

      setHierarchyStateMap((prev) => {
        const state = prev.get(filterKey);
        if (!state?.mainHierarchy) return prev;

        const filterTreeProps = buildHierarchyFilterTreeProps(
          state.mainHierarchy,
          state.codelists,
          filter.id ?? '',
          constraints,
          codelistUrn,
        );

        const next = new Map(prev);
        next.set(filterKey, { ...state, treeNodes: filterTreeProps });
        return next;
      });
    },
    [structureDataMaps?.dimensionsMap, structureDataMaps?.structuresMap],
  );

  const handleFiltersWithConstraints = useCallback(
    (
      filters: Filter[],
      setFilters: (filters: Filter[]) => void,
      setIsConstraintsLoading?: (isLoading: boolean) => void,
      changedFilter?: Filter,
    ) => {
      const filtersMap = buildFiltersMap(filters);

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
            rebuildHierarchyTree(changedFilter, currentConstraintsMap);
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
    [actions, dataQueries, locale, rebuildHierarchyTree, structureDataMaps],
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

  // Load available hierarchies for a filter
  const loadAvailableHierarchies = useCallback(
    async (filter: Filter) => {
      if (!actions?.getAvailableHierarchies) return;
      const codelistUrn = getCodelistUrnForFilter(
        filter,
        structureDataMaps?.dimensionsMap,
        structureDataMaps?.structuresMap,
      );
      if (!codelistUrn) return;

      const filterKey = getFilterIdentity(filter);
      if (!filterKey) return;
      setHierarchyStateMap((prev) => {
        const next = new Map(prev);
        const existing = prev.get(filterKey) ?? EMPTY_HIERARCHY_STATE;
        next.set(filterKey, { ...existing, isLoading: true });
        return next;
      });

      try {
        const response: StructuralMetaData =
          await actions.getAvailableHierarchies(codelistUrn);
        const availableHierarchies = getLatestHierarchies(
          response?.data?.hierarchies ?? [],
        );
        setHierarchyStateMap((prev) => {
          const next = new Map(prev);
          const existing = prev.get(filterKey) ?? EMPTY_HIERARCHY_STATE;
          next.set(filterKey, {
            ...existing,
            availableHierarchies,
            isLoading: false,
          });
          return next;
        });
      } catch {
        setHierarchyStateMap((prev) => {
          const next = new Map(prev);
          const existing = prev.get(filterKey) ?? EMPTY_HIERARCHY_STATE;
          next.set(filterKey, { ...existing, isLoading: false });
          return next;
        });
      }
    },
    [
      actions,
      structureDataMaps?.dimensionsMap,
      structureDataMaps?.structuresMap,
    ],
  );

  const loadHierarchyTree = useCallback(
    async (filter: Filter, hierarchy: Hierarchy) => {
      if (!actions?.getHierarchy) return;
      const filterKey = getFilterIdentity(filter);
      if (!filterKey) return;
      const codelistUrn = getCodelistUrnForFilter(
        filter,
        structureDataMaps?.dimensionsMap,
        structureDataMaps?.structuresMap,
      );

      setHierarchyStateMap((prev) => {
        const next = new Map(prev);
        const existing = prev.get(filterKey) ?? EMPTY_HIERARCHY_STATE;
        next.set(filterKey, { ...existing, isLoading: true });
        return next;
      });

      try {
        const hierarchyUrn = buildHierarchyUrn(hierarchy);
        const response: StructuralMetaData =
          await actions.getHierarchy(hierarchyUrn);
        const mainHierarchy = response?.data?.hierarchies?.find(
          (h) => buildHierarchyUrn(h) === hierarchyUrn,
        );

        if (!mainHierarchy) {
          setHierarchyStateMap((prev) => {
            const next = new Map(prev);
            const existing = prev.get(filterKey) ?? EMPTY_HIERARCHY_STATE;
            next.set(filterKey, {
              ...existing,
              selectedHierarchy: hierarchy,
              mainHierarchy: null,
              treeNodes: [],
              isLoading: false,
            });
            return next;
          });
          return;
        }

        const codelists: CodelistData[] = resolveCodelistsFromResponse(
          response?.data,
        );
        const datasetUrn =
          filter.filterType === 'dataset'
            ? filter.datasetUrn
            : filter.sourceDatasetUrns?.[0];
        const constraints = datasetUrn
          ? constraintsMapRef.current?.get(datasetUrn)
          : undefined;

        const filterTreeProps = buildHierarchyFilterTreeProps(
          mainHierarchy,
          codelists,
          filter.id ?? '',
          constraints,
          codelistUrn,
        );

        setHierarchyStateMap((prev) => {
          const next = new Map(prev);
          const existing = prev.get(filterKey) ?? EMPTY_HIERARCHY_STATE;
          next.set(filterKey, {
            ...existing,
            selectedHierarchy: hierarchy,
            mainHierarchy,
            codelists,
            treeNodes: filterTreeProps,
            isLoading: false,
          });
          return next;
        });
      } catch {
        setHierarchyStateMap((prev) => {
          const next = new Map(prev);
          const existing = prev.get(filterKey) ?? EMPTY_HIERARCHY_STATE;
          next.set(filterKey, {
            ...existing,
            isLoading: false,
          });
          return next;
        });
      }
    },
    [
      actions,
      structureDataMaps?.dimensionsMap,
      structureDataMaps?.structuresMap,
    ],
  );

  const onSelectHierarchy = useCallback(
    (filter?: Filter, hierarchy?: Hierarchy | null) => {
      if (!filter) return;
      const filterKey = getFilterIdentity(filter);
      if (!filterKey) return;

      if (!hierarchy) {
        setHierarchyStateMap((prev) => {
          const next = new Map(prev);
          const existing = prev.get(filterKey) ?? EMPTY_HIERARCHY_STATE;
          next.set(filterKey, {
            ...existing,
            selectedHierarchy: null,
            mainHierarchy: null,
            treeNodes: [],
          });
          return next;
        });
        return;
      }

      loadHierarchyTree(filter, hierarchy);
    },
    [loadHierarchyTree],
  );

  const onExpandHierarchyNode = useCallback(
    (filterKey: string, nodeId: string) => {
      setHierarchyStateMap((prev) => {
        const state = prev.get(filterKey);
        if (!state?.treeNodes) return prev;
        const next = new Map(prev);
        next.set(filterKey, {
          ...state,
          treeNodes: toggleTreeNodeExpansion(state.treeNodes, nodeId),
        });
        return next;
      });
    },
    [],
  );

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
      const filtersMap = buildFiltersMap(filtersToUpdate);

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

      handleFiltersDelete(filtersAfterDelete, dataQuery ? [dataQuery] : []);
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
      addSystemMessage(appliedFiltersMap);
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
