'use client';

import FilterSettings from './FiltersModal/FiltersSettings';
import { Filter, FiltersProps } from '../../../models/filters';
import {
  getDatasetFilters,
  getFiltersAfterClear,
  getFiltersAfterDelete,
  getFiltersPreselectedByDataQuery,
  getSelectedFilterValues,
  getTotalSelectedValuesLength,
  updateFiltersWithDisabledOption,
  updateFiltersWithDisplayMode,
  updateFiltersWithSelectedItem,
} from '../../../utils/filters';
import { getFilledFilters } from '../../../utils/get-filled-filters';
import { getSeriesFilterDto } from '../../../utils/get-series-filters';
import {
  getQueryFilters,
  setDataQueryFilters,
} from '../../../utils/query-filters';
import { DataConstraints } from '@statgpt/sdmx-toolkit/src/models/structural-metadata/constraints';
import {
  getAnnotationPeriod,
  getAvailableCodesFromConstrains,
} from '@statgpt/sdmx-toolkit/src/utils/constraint';
import { findCodelistByDimension } from '@statgpt/sdmx-toolkit/src/utils/find-codelist-by-dimension';
import { getTimeSeriesCount } from '@statgpt/sdmx-toolkit/src/utils/time-series-count';
import { TimeRange } from '@statgpt/shared-toolkit/src/models/time-range';
import { Locale } from '@statgpt/shared-toolkit/src/types/locale';
import { Popup } from '@statgpt/ui-components/src/components/Popup/Popup';
import { PopUpSize, PopUpState } from '@statgpt/ui-components/src/types/pop-up';
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
import { updateMessagesWithSystemMessage } from '../../../utils/system-message';

const Filters: FC<FiltersProps> = ({
  actions,
  dimensions,
  structureDimensions,
  structures,
  buttonProps,
  modalProps,
  attachmentsDataQuery,
  initialConstraints,
  onFiltersChange,
  locale,
  timeRangeOptions,
  titles,
  conversationKey,
  conversation,
  setConversation,
  updateConversation,
}) => {
  const [modalState, setModalState] = useState(PopUpState.Closed);
  const [modalFilters, setModalFilters] = useState<Filter[]>([]);
  const [appliedFilters, setAppliedFilters] = useState<Filter[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<Filter>();
  const [initialTimeRange, setInitialTimeRange] = useState<TimeRange>();
  const [shouldPreselectFromDataQuery, setShouldPreselectFromDataQuery] =
    useState(true);
  const [selectedFilterValues, setSelectedFilterValues] = useState<Filter[]>(
    [],
  );
  const constraintsRef = useRef<DataConstraints[]>(initialConstraints || []);
  const [initialModalConstraints, setInitialModalConstraints] = useState<
    DataConstraints[]
  >([]);
  const [isConstraintsLoading, setIsConstraintsLoading] = useState<boolean>();
  const [isDisableFilterValues, setIsDisableFilterValues] = useState<boolean>();

  const updateSelectedFilterValues = (filter?: Filter) => {
    const filters = filter
      ? modalFilters.map((oldFilter) =>
          oldFilter.id === filter.id ? filter : oldFilter,
        )
      : modalFilters;

    setIsDisableFilterValues(true);
    setModalFilters(updateFiltersWithDisabledOption(filters));

    handleFiltersWithConstraints(
      filter?.isTimeDimension
        ? updateFiltersWithSelectedItem(filters, filter)
        : filters,
      setModalFilters,
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
    ) => {
      actions
        ?.getConstraints(
          attachmentsDataQuery?.urn as string,
          getSeriesFilterDto(filters),
        )
        .then((constraints) => {
          const newConstraints = constraints?.data?.dataConstraints || [];
          constraintsRef.current = newConstraints;
          setIsConstraintsLoading?.(false);
          setFilters(
            getFilledFilters(
              filters,
              dimensions,
              structures,
              newConstraints,
              locale as Locale,
            ),
          );
        })
        .catch(() => {
          constraintsRef.current = [];
          setIsConstraintsLoading?.(false);
          setFilters(
            getFilledFilters(
              filters,
              dimensions,
              structures,
              [],
              locale as Locale,
            ),
          );
        })
        .finally(() => {
          setIsDisableFilterValues(false);
        });
    },
    [actions, attachmentsDataQuery?.urn, dimensions, locale, structures],
  );

  useEffect(() => {
    const constraintsTimeRange = getAnnotationPeriod(
      constraintsRef.current?.[0]?.annotations,
    );
    setInitialTimeRange(constraintsTimeRange);
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

    if (shouldPreselectFromDataQuery) {
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
    }
  }, [
    dimensions,
    structureDimensions,
    structures,
    attachmentsDataQuery,
    locale,
    initialConstraints,
    shouldPreselectFromDataQuery,
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
      setSelectedFilter({ ...appliedFilters?.[0], isSelectedFilter: true });
      setModalFilters(appliedFilters);
    }
    if (modalState === PopUpState.Closed) {
      setSelectedFilter(void 0);
    }
  }, [appliedFilters, modalState]);

  const addSystemMessage = useCallback(
    async (filters: Filter[]) => {
      const updatedConversationWithSystemMessage = conversation
        ? {
            ...conversation,
            messages: updateMessagesWithSystemMessage(
              conversation?.messages,
              setDataQueryFilters(filters),
              attachmentsDataQuery,
            ),
          }
        : null;

      setConversation?.(updatedConversationWithSystemMessage);

      await updateConversation(decodeURI(conversationKey), {
        name: updatedConversationWithSystemMessage?.name,
        messages: updatedConversationWithSystemMessage?.messages || [],
      });
    },
    [
      attachmentsDataQuery,
      conversation,
      conversationKey,
      setConversation,
      updateConversation,
    ],
  );

  const onSelectDisplayMode = useCallback(
    (filterId?: string, displayMode?: string) => {
      setModalFilters((prevFilters) =>
        updateFiltersWithDisplayMode(prevFilters, filterId, displayMode),
      );
      if (selectedFilter?.id === filterId) {
        setSelectedFilter((prevFilter) => ({
          ...prevFilter,
          displayMode,
        }));
      }
    },
    [selectedFilter?.id],
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
          filledFilters?.find(
            (filter) => filter?.id === previousSelectedFilter?.id,
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

      actions
        ?.getConstraints(
          attachmentsDataQuery?.urn || '',
          getSeriesFilterDto(filtersToUpdate),
        )
        .then((constraints) => {
          updateViewAfterDelete(
            constraints?.data?.dataConstraints || [],
            filtersToUpdate,
          );
        })
        .catch(() => {
          updateViewAfterDelete([], filtersToUpdate);
        });
    },
    [actions, attachmentsDataQuery?.urn, updateViewAfterDelete],
  );

  const onDeleteFilter = useCallback(
    (filterId?: string) => {
      const filtersAfterDelete = getFiltersAfterDelete(modalFilters, filterId);

      handleFiltersDelete(filtersAfterDelete);
    },
    [handleFiltersDelete, modalFilters],
  );

  const onCloseModal = useCallback(() => {
    constraintsRef.current = initialModalConstraints;
    setModalState(PopUpState.Closed);
  }, [initialModalConstraints]);

  const onClearAllFilters = useCallback(() => {
    const filtersAfterClear = getFiltersAfterClear(modalFilters);

    handleFiltersDelete(filtersAfterClear);
  }, [handleFiltersDelete, modalFilters]);

  const onApply = useCallback(() => {
    const params = getFiltersChangeParams(modalFilters);
    onFiltersChange?.(params);

    if (shouldPreselectFromDataQuery) {
      setShouldPreselectFromDataQuery(false);
    }

    setAppliedFilters(modalFilters);
    setModalState(PopUpState.Closed);

    startTransition(() => {
      addSystemMessage(modalFilters);
    });
  }, [
    getFiltersChangeParams,
    modalFilters,
    onFiltersChange,
    shouldPreselectFromDataQuery,
    addSystemMessage,
  ]);

  return (
    <div className="filters-container">
      <FilterButton
        buttonProps={buttonProps}
        selectedFiltersCount={getTotalSelectedValuesLength(
          selectedFilterValues,
        )}
        isLoading={isConstraintsLoading}
        setModalState={setModalState}
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
              initialTimeRange={initialTimeRange}
              timeRangeOptions={timeRangeOptions}
              filtersList={modalFilters}
              selectedFilter={selectedFilter}
              isDisableValues={isDisableFilterValues}
              modalProps={modalProps}
              timeSeriesCount={getTimeSeriesCount(
                constraintsRef.current?.[0]?.annotations,
              )}
              setSelectedFilter={setSelectedFilter}
              onSelectDisplayMode={onSelectDisplayMode}
              onDeleteFilter={onDeleteFilter}
              updateSelectedFilterValues={updateSelectedFilterValues}
            />
            <ModalFooter
              titles={titles}
              onApply={onApply}
              onClose={onCloseModal}
              onClearAllFilters={onClearAllFilters}
              modalProps={modalProps}
            />
          </Popup>
        )}
      </>
    </div>
  );
};

export default Filters;
