'use client';

import {
  DataConstraints,
  findCodelistByDimension,
  generateShortUrn,
  getAvailableCodesFromConstrains,
  getKeyFromUrn,
  getTimeSeriesCount,
  TIME_PERIOD,
} from '@epam/statgpt-sdmx-toolkit';
import { Locale } from '@epam/statgpt-shared-toolkit';
import { Popup, PopUpSize, PopUpState } from '@epam/statgpt-ui-components';
import FilterSettings from './FiltersModal/FiltersSettings';
import { Filter, FiltersProps } from '../../../models/filters';
import {
  getDatasetFilters,
  getFilterIdentity,
  getFiltersAfterClear,
  getFiltersAfterDelete,
  getFiltersPreselectedByDataQuery,
  isSameFilter,
  getSelectedFilterValues,
  getTotalSelectedValuesLength,
  updateFiltersWithDisabledOption,
  updateFiltersWithDisplayMode,
  updateFiltersWithSelectedItem,
} from '../../../utils/filters';
import { getFilledFilters } from '../../../utils/get-filled-filters';
import { getSeriesFilterDto } from '../../../utils/get-series-filters';
import { getSourceArtefactUrnForDatasetFilter } from '../../../utils/hierarchy-request-context';
import { normalizeConstraintFilters } from '../../../utils/normalize-constraint-filters';
import {
  getQueryFilters,
  setDataQueryFilters,
} from '../../../utils/query-filters';
import {
  FC,
  startTransition,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import ModalFooter from './FiltersModal/ModalFooter';
import FilterButton from './FilterButton/FilterButton';
import { useConversationViewStyles } from '../../../context/ConversationViewStylesContext';
import { useFiltersModalState } from '../../../context/FiltersModalStateContext';
import { updateMessagesWithSystemMessage } from '../../../utils/system-message';
import { getUpdatedDataQueries } from '../../../utils/get-updated-data-queries';
import { useHierarchyState } from '../../../utils/use-hierarchy-state';
import {
  buildRequestCacheKey,
  getCachedRequestResult,
  isRequestCached,
} from '../../../utils/request-cache';
import { cleanIncompatibleFilters } from '../../../utils/incompatible-filters';

const EMPTY_DISABLED_SET = new Set<string>();

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
  const [modalFilters, setModalFilters] = useState<Filter[]>([]);
  const [appliedFilters, setAppliedFilters] = useState<Filter[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<Filter>();
  const [selectedFilterValues, setSelectedFilterValues] = useState<Filter[]>(
    [],
  );
  const [selectedTimeOption, setSelectedTimeOption] = useState<
    string | number | undefined
  >(undefined);
  const constraintsRef = useRef<DataConstraints[]>(initialConstraints || []);
  const [initialModalConstraints, setInitialModalConstraints] = useState<
    DataConstraints[]
  >([]);
  const [isConstraintsLoading, setIsConstraintsLoading] = useState<boolean>();
  const [isDisableFilterValues, setIsDisableFilterValues] = useState<boolean>();
  const [isFilterValuesLoading, setIsFilterValuesLoading] = useState(false);
  const filterValuesLoadingRequestsRef = useRef(0);
  const isPreselectedFromDataQuery = useRef(false);

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

  const getCodelistUrnForFilter = useCallback(
    (filter: Filter): string | undefined => {
      const dimension = dimensions?.find((d) => d.id === filter.id);
      if (!dimension) return undefined;

      const localEnumerationUrn = getKeyFromUrn(
        dimension.localRepresentation?.enumeration,
      );
      if (localEnumerationUrn) {
        return localEnumerationUrn;
      }

      const codelist = findCodelistByDimension(
        structures?.codelists,
        structures?.conceptSchemes,
        dimension,
      );

      return codelist
        ? (getKeyFromUrn(codelist.urn) ??
            generateShortUrn(codelist.id, codelist.version, codelist.agencyID))
        : undefined;
    },
    [dimensions, structures?.codelists, structures?.conceptSchemes],
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
      setInitialModalConstraints(constraintsRef.current);
    }
  }, [modalState]);

  const handleFiltersWithConstraints = useCallback(
    (
      filters: Filter[],
      setFilters: (filters: Filter[]) => void,
      setIsConstraintsLoading?: (isLoading: boolean) => void,
      changedFilter?: Filter,
    ) => {
      const attachmentUrn = attachmentsDataQuery?.urn ?? '';
      const constraintFilters = normalizeConstraintFilters(
        getSeriesFilterDto(filters).filter(
          (filter) => filter.componentCode !== TIME_PERIOD,
        ),
      );
      const cacheKey = buildRequestCacheKey(attachmentUrn, constraintFilters);
      const shouldTrackFilterValuesLoading =
        !!actions?.getConstraints &&
        !isRequestCached(actions.getConstraints, cacheKey);

      if (shouldTrackFilterValuesLoading) {
        startFilterValuesLoading();
      }

      const request = actions
        ? getCachedRequestResult(actions.getConstraints, cacheKey, () =>
            actions.getConstraints(attachmentUrn, constraintFilters),
          )
        : Promise.resolve(undefined);

      request
        .then((constraints) => {
          const newConstraints = constraints?.data?.dataConstraints || [];

          if (changedFilter) {
            const { filters: cleanedFilters, changed } =
              cleanIncompatibleFilters(
                filters,
                dimensions,
                structures,
                newConstraints,
                changedFilter,
                locale as Locale,
              );

            if (changed) {
              constraintsRef.current = newConstraints;
              setIsConstraintsLoading?.(true);
              setIsDisableFilterValues(true);
              handleFiltersWithConstraints(
                cleanedFilters,
                setFilters,
                setIsConstraintsLoading,
                changedFilter,
              );
              return;
            }
          }

          const filledFilters = getFilledFilters(
            filters,
            dimensions,
            structures,
            newConstraints,
            locale as Locale,
          );

          constraintsRef.current = newConstraints;
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
            rebuildHierarchyTree(changedFilter, newConstraints);
          }
        })
        .catch(() => {
          const filledFilters = getFilledFilters(
            filters,
            dimensions,
            structures,
            [],
            locale as Locale,
          );

          constraintsRef.current = [];
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
      attachmentsDataQuery?.urn,
      dimensions,
      finishFilterValuesLoading,
      locale,
      rebuildHierarchyTree,
      startFilterValuesLoading,
      structures,
    ],
  );

  useEffect(() => {
    const datasetFilters = getDatasetFilters(
      dimensions,
      structures,
      structureDimensions,
      locale,
    );
    const filledDimensions = dimensions?.map((dimension) => {
      const codeList = findCodelistByDimension(
        structures?.codelists,
        structures?.conceptSchemes,
        dimension,
      );
      const availableTerms = getAvailableCodesFromConstrains(
        codeList?.codes,
        dimension.id,
        constraintsRef.current,
        locale,
      );
      return {
        ...dimension,
        dimensionValues: availableTerms,
      };
    });
    const dataFiltersFilled = datasetFilters.map((filter) => {
      const dimensionValues =
        filledDimensions?.find((dim) => dim.id === filter.id)
          ?.dimensionValues || [];
      return {
        ...filter,
        dimensionValues,
      };
    });

    if (!isPreselectedFromDataQuery.current) {
      if (!structures) return;
      const filtersFromDataQuery = getFiltersPreselectedByDataQuery(
        dataFiltersFilled,
        attachmentsDataQuery,
        constraintsRef.current,
      );
      setIsConstraintsLoading?.(true);
      handleFiltersWithConstraints(
        filtersFromDataQuery,
        setAppliedFilters,
        setIsConstraintsLoading,
      );
      isPreselectedFromDataQuery.current = true;
    }
  }, [
    dimensions,
    structureDimensions,
    structures,
    attachmentsDataQuery,
    locale,
    initialConstraints,
    handleFiltersWithConstraints,
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
      const firstFilter = appliedFilters.find((f) => !f.isTimeDimension);
      setSelectedFilter(
        firstFilter ? { ...firstFilter, isSelectedFilter: true } : void 0,
      );
      setModalFilters(appliedFilters);
    }
    if (modalState === PopUpState.Closed) {
      setSelectedFilter(void 0);
    }
  }, [appliedFilters, modalState]);

  useEffect(() => {
    if (!selectedFilter || selectedFilter.isTimeDimension) {
      return;
    }

    const filterKey = getFilterIdentity(selectedFilter);
    if (!filterKey) return;
    const existingState = hierarchyStateMap.get(filterKey);

    if (!existingState) {
      loadAvailableHierarchies(selectedFilter);
    }
  }, [selectedFilter, hierarchyStateMap, loadAvailableHierarchies]);

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
    async (filters: Filter[]) => {
      const dataQueryFilters = setDataQueryFilters(filters);
      const updatedConversationWithSystemMessage = conversation
        ? {
            ...conversation,
            messages: updateMessagesWithSystemMessage(
              conversation?.messages,
              dataQueries,
              void 0,
              dataQueryFilters,
              attachmentsDataQuery,
            ),
          }
        : null;

      setConversation?.(updatedConversationWithSystemMessage);

      updateDataQueries?.(
        getUpdatedDataQueries(
          dataQueries,
          void 0,
          dataQueryFilters,
          attachmentsDataQuery,
        ),
      );

      await updateConversation(decodeURI(conversationKey), {
        name: updatedConversationWithSystemMessage?.name,
        messages: updatedConversationWithSystemMessage?.messages || [],
      });
    },
    [
      attachmentsDataQuery,
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

  const getFiltersChangeParams = useCallback(
    (filters: Filter[]) => getQueryFilters(filters, dimensions),
    [dimensions],
  );

  const updateViewAfterDelete = useCallback(
    (dataConstraints: DataConstraints[], filtersToUpdate: Filter[]) => {
      const filledFilters = getFilledFilters(
        filtersToUpdate,
        dimensions,
        structures,
        dataConstraints,
        locale as Locale,
      );
      constraintsRef.current = dataConstraints;

      setSelectedFilter(
        (previousSelectedFilter) =>
          filledFilters?.find((filter) =>
            isSameFilter(filter, previousSelectedFilter),
          ) || previousSelectedFilter,
      );
      setModalFilters(filledFilters);
      setIsDisableFilterValues(false);
    },
    [dimensions, locale, structures],
  );

  const handleFiltersDelete = useCallback(
    (filtersToUpdate: Filter[]) => {
      setIsDisableFilterValues(true);
      setModalFilters(updateFiltersWithDisabledOption(filtersToUpdate));
      const attachmentUrn = attachmentsDataQuery?.urn ?? '';
      const constraintFilters = normalizeConstraintFilters(
        getSeriesFilterDto(filtersToUpdate).filter(
          (filter) => filter.componentCode !== TIME_PERIOD,
        ),
      );

      const cacheKey = buildRequestCacheKey(attachmentUrn, constraintFilters);
      const shouldTrackFilterValuesLoading =
        !!actions?.getConstraints &&
        !isRequestCached(actions.getConstraints, cacheKey);

      if (shouldTrackFilterValuesLoading) {
        startFilterValuesLoading();
      }

      const request = actions
        ? getCachedRequestResult(actions.getConstraints, cacheKey, () =>
            actions.getConstraints(attachmentUrn, constraintFilters),
          )
        : Promise.resolve(undefined);

      request
        .then((constraints) => {
          updateViewAfterDelete(
            constraints?.data?.dataConstraints || [],
            filtersToUpdate,
          );
        })
        .catch(() => {
          updateViewAfterDelete([], filtersToUpdate);
        })
        .finally(() => {
          if (shouldTrackFilterValuesLoading) {
            finishFilterValuesLoading();
          }
        });
    },
    [
      actions,
      attachmentsDataQuery?.urn,
      finishFilterValuesLoading,
      startFilterValuesLoading,
      updateViewAfterDelete,
    ],
  );

  const onDeleteFilter = useCallback(
    (filter?: Filter) => {
      const filtersAfterDelete = getFiltersAfterDelete(modalFilters, filter);

      handleFiltersDelete(filtersAfterDelete);
    },
    [handleFiltersDelete, modalFilters],
  );

  const onCloseModal = useCallback(() => {
    constraintsRef.current = initialModalConstraints;
    setModalState(PopUpState.Closed);
    setIsModalClosed(true);
  }, [initialModalConstraints, setModalState, setIsModalClosed]);

  const onClearAllFilters = useCallback(() => {
    const filtersAfterClear = getFiltersAfterClear(modalFilters);

    handleFiltersDelete(filtersAfterClear);
  }, [handleFiltersDelete, modalFilters]);

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
    getFiltersChangeParams,
    modalFilters,
    onFiltersChange,
    addSystemMessage,
    constraintsRef,
    setModalState,
    setIsModalClosed,
  ]);
  const onTimePeriodChange = (value: string | number) => {
    setSelectedTimeOption(value);
  };

  const timeSeriesCount = Number(
    getTimeSeriesCount(constraintsRef?.current?.[0]?.annotations),
  );

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
              initialConstraints={initialConstraints}
              timeSeriesCount={`${timeSeriesCount}`}
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
              dataQueries={
                attachmentsDataQuery ? [attachmentsDataQuery] : undefined
              }
              disabledDatasetUrns={EMPTY_DISABLED_SET}
              onToggleDataset={() => {}}
              onClearAllDatasets={() => {}}
            />
            <ModalFooter
              onApply={onApply}
              onClose={onCloseModal}
              onClearAllFilters={onClearAllFilters}
              modalProps={modalProps}
              applyDisabled={isConstraintsLoading || isDisableFilterValues}
              timeseriesLength={timeSeriesCount}
              limitMessages={limitMessages}
            />
          </Popup>
        )}
      </>
    </div>
  );
};

export default Filters;
