import { render, act } from '@testing-library/react';
import { createElement } from 'react';
import MultiDatasetFilters from '../MultiDatasetFilters';
import type { Filter } from '../../../../models/filters';
import type { DataQuery } from '@epam/statgpt-shared-toolkit';
import type { StructureDataMaps } from '../../../../models/structure-data';
import type { DatasetQueryFilters } from '@epam/statgpt-sdmx-toolkit';
import { COMMON_COUNTRY_FILTER_ID } from '../../../../utils/multiple-filters';

// ─── Module mocks ─────────────────────────────────────────────────────────────

jest.mock('@epam/statgpt-sdmx-toolkit', () => ({}));
jest.mock('@epam/ai-dial-shared', () => ({}));

// ─── Captured callbacks ────

const mockCallbacks: {
  setModalState: ((state: string) => void) | null;
  onApply: (() => void) | null;
  onDeleteFilter: ((filter?: Filter) => void) | null;
  selectedFiltersCount: number | null;
} = {
  setModalState: null,
  onApply: null,
  onDeleteFilter: null,
  selectedFiltersCount: null,
};

// ─── Mock implementations ───────────────────────

const mockGetFiltersPreselectedByDataQueries = jest.fn(() => [] as Filter[]);
const mockBuildFiltersMap = jest.fn(() => new Map<string, Filter[]>());
const mockGetFiltersByConstraints = jest.fn(() => [] as Filter[]);
const mockGetConstraintsRequests = jest.fn(() => [] as Promise<unknown>[]);
const mockGetConstraintsMapFromSettledResults = jest.fn(() => new Map());
const mockIsStructureDataMapsReady = jest.fn(() => false);
const mockGetFilledDatasetFiltersMap = jest.fn(
  () => new Map<string, Filter[]>(),
);
const mockGetQueryFiltersMap = jest.fn(() => new Map());
const mockSetDataQueryFiltersMap = jest.fn(() => new Map());
const mockHasUncachedConstraintRequests = jest.fn(() => false);
const mockMergeConstraintsMaps = jest.fn(
  (
    baseConstraintsMap: Map<string, unknown> | undefined,
    updatedConstraintsMap: Map<string, unknown>,
  ) => {
    const mergedConstraintsMap = new Map(baseConstraintsMap);

    updatedConstraintsMap.forEach((constraints, datasetUrn) => {
      mergedConstraintsMap.set(datasetUrn, constraints);
    });

    return mergedConstraintsMap;
  },
);

jest.mock('@epam/statgpt-ui-components', () => {
  const R = require('react');
  return {
    Popup: (props: any) =>
      R.createElement('div', { 'data-testid': 'popup' }, props.children),
    PopUpSize: { LG: 'LG' },
    PopUpState: { Opened: 'opened', Closed: 'closed' },
    LimitMessages: {},
  };
});

jest.mock('../../../../utils/multiple-filters', () => ({
  COMMON_COUNTRY_FILTER_ID: 'COUNTRY',
  COMMON_FREQUENCY_FILTER_ID: 'FREQUENCY',
  COMMON_TIME_PERIOD_FILTER_ID: 'TIME_PERIOD',
  isStructureDataMapsReady: (...args: any[]) =>
    (mockIsStructureDataMapsReady as any)(...args),
  getFilledDatasetFiltersMap: (...args: any[]) =>
    (mockGetFilledDatasetFiltersMap as any)(...args),
  getFiltersPreselectedByDataQueries: (...args: any[]) =>
    (mockGetFiltersPreselectedByDataQueries as any)(...args),
  buildFiltersMap: (...args: any[]) => (mockBuildFiltersMap as any)(...args),
  getFiltersByConstraints: (...args: any[]) =>
    (mockGetFiltersByConstraints as any)(...args),
  getConstraintsRequests: (...args: any[]) =>
    (mockGetConstraintsRequests as any)(...args),
  getConstraintsMapFromSettledResults: (...args: any[]) =>
    (mockGetConstraintsMapFromSettledResults as any)(...args),
  hasUncachedConstraintRequests: (...args: any[]) =>
    (mockHasUncachedConstraintRequests as any)(...args),
  mergeConstraintsMaps: (...args: any[]) =>
    (mockMergeConstraintsMaps as any)(...args),
  getQueryFiltersMap: (...args: any[]) =>
    (mockGetQueryFiltersMap as any)(...args),
  setDataQueryFiltersMap: (...args: any[]) =>
    (mockSetDataQueryFiltersMap as any)(...args),
}));

jest.mock('../../../../utils/filters', () => ({
  getFiltersAfterClear: jest.fn((filters: any[]) =>
    filters.map((f: any) => ({
      ...f,
      dimensionValues: f.dimensionValues?.map((v: any) => ({
        ...v,
        isSelectedValue: false,
      })),
    })),
  ),
  getFiltersAfterDelete: jest.fn((filters: any[], filterToDelete: any) =>
    filters.filter((f: any) => f.id !== filterToDelete?.id),
  ),
  getSelectedFilterValues: jest.fn((filters: any[]) =>
    filters.filter((f: any) =>
      f.dimensionValues?.some((v: any) => v.isSelectedValue),
    ),
  ),
  getTotalSelectedValuesLength: jest.fn((filters: any[]) =>
    filters.reduce(
      (sum: number, f: any) =>
        sum +
        (f.dimensionValues?.filter((v: any) => v.isSelectedValue).length || 0),
      0,
    ),
  ),
  isSameFilter: jest.fn(
    (a: any, b: any) => a?.id === b?.id && a?.datasetUrn === b?.datasetUrn,
  ),
  updateFiltersWithDisabledOption: jest.fn((filters: any[]) =>
    filters.map((f: any) => ({ ...f, isDisabled: true })),
  ),
  updateFiltersWithDisplayMode: jest.fn(
    (filters: any[], filter: any, displayMode: any) =>
      filters.map((f: any) =>
        f.id === filter?.id ? { ...f, displayMode } : f,
      ),
  ),
  updateFiltersWithSelectedItem: jest.fn(
    (filters: any[], selectedFilter: any) =>
      filters.map((f: any) => ({
        ...f,
        isSelectedFilter: f.id === selectedFilter?.id,
      })),
  ),
  getFilterIdentity: jest.fn((filter: any) =>
    filter?.datasetUrn ? `${filter.datasetUrn}:${filter.id}` : filter?.id,
  ),
}));

jest.mock('../../Filters/FilterButton/FilterButton', () => {
  const R = require('react');
  return {
    __esModule: true,
    default: (props: any) => {
      mockCallbacks.setModalState = props.setModalState;
      mockCallbacks.selectedFiltersCount = props.selectedFiltersCount;
      return R.createElement('button', {
        'data-testid': 'filter-button',
        onClick: () => props.setModalState('opened'),
      });
    },
  };
});

jest.mock('../../Filters/FiltersModal/FiltersSettings', () => {
  const R = require('react');
  return {
    __esModule: true,
    default: (props: any) => {
      mockCallbacks.onDeleteFilter = props.onDeleteFilter;
      return R.createElement('div', { 'data-testid': 'filter-settings' });
    },
  };
});

jest.mock('../../Filters/FiltersModal/ModalFooter', () => {
  const R = require('react');
  return {
    __esModule: true,
    default: (props: any) => {
      mockCallbacks.onApply = props.onApply;
      return R.createElement('button', {
        'data-testid': 'apply-button',
        onClick: props.onApply,
      });
    },
  };
});

jest.mock('../../../../utils/system-message', () => ({
  updateMessagesWithSystemMessage: jest.fn(() => []),
}));

jest.mock('../../../../utils/get-updated-data-queries', () => ({
  getUpdatedDataQueries: jest.fn(() => []),
}));

jest.mock('../../../../context/ConversationViewFeatureTogglesContext', () => ({
  useConversationViewFeatureToggles: jest.fn(() => ({
    isCrossDatasetModeOn: false,
  })),
}));

jest.mock('../../../../utils/hierarchy-view', () => ({
  hierarchyNodesToFilterTreeProps: jest.fn(() => []),
}));

// ─── Test data ────────────────────────────────────────────────────────────────

const DATASET_A_URN = 'AGENCY:DF_A(1.0)';
const DATASET_B_URN = 'AGENCY:DF_B(1.0)';

const makeSharedCountryFilter = (): Filter => ({
  id: COMMON_COUNTRY_FILTER_ID,
  filterType: 'shared',
  sourceDatasetUrns: [DATASET_A_URN, DATASET_B_URN],
  dimensionValues: [
    {
      id: 'name:france',
      name: 'France',
      isSelectedValue: true,
      sourceValues: [
        { datasetUrn: DATASET_A_URN, id: 'FR', name: 'France' },
        { datasetUrn: DATASET_B_URN, id: 'FRA', name: 'France' },
      ],
    },
    {
      id: 'name:germany',
      name: 'Germany',
      isSelectedValue: false,
      sourceValues: [{ datasetUrn: DATASET_A_URN, id: 'DE', name: 'Germany' }],
    },
  ],
});

const defaultProps = {
  conversationKey: 'test-conversation',
  updateConversation: jest.fn(() => Promise.resolve({} as any)),
  dataQueries: [
    { urn: DATASET_A_URN } as DataQuery,
    { urn: DATASET_B_URN } as DataQuery,
  ],
  structureDataMaps: {
    dimensionsMap: new Map(),
    structuresMap: new Map(),
    structureDimensionsMap: new Map(),
    constraintsMap: new Map(),
  } as StructureDataMaps,
  actions: { getConstraints: jest.fn(() => Promise.resolve({} as any)) },
};

// ─── Setup / teardown ────────────────────────────────────────────────────────

beforeEach(() => {
  mockCallbacks.setModalState = null;
  mockCallbacks.onApply = null;
  mockCallbacks.onDeleteFilter = null;
  mockCallbacks.selectedFiltersCount = null;
  jest.clearAllMocks();
  mockGetConstraintsRequests.mockReturnValue([]);
  mockGetConstraintsMapFromSettledResults.mockReturnValue(new Map());
  mockGetFiltersPreselectedByDataQueries.mockReturnValue([]);
  mockBuildFiltersMap.mockReturnValue(new Map());
  mockGetFiltersByConstraints.mockReturnValue([]);
  mockGetFilledDatasetFiltersMap.mockReturnValue(new Map());
  mockGetQueryFiltersMap.mockReturnValue(new Map());
  mockSetDataQueryFiltersMap.mockReturnValue(new Map());
  mockHasUncachedConstraintRequests.mockReturnValue(false);
  mockMergeConstraintsMaps.mockImplementation(
    (
      baseConstraintsMap: Map<string, unknown> | undefined,
      updatedConstraintsMap: Map<string, unknown>,
    ) => {
      const mergedConstraintsMap = new Map(baseConstraintsMap);

      updatedConstraintsMap.forEach((constraints, datasetUrn) => {
        mergedConstraintsMap.set(datasetUrn, constraints);
      });

      return mergedConstraintsMap;
    },
  );
  mockIsStructureDataMapsReady.mockReturnValue(false);
  (defaultProps.updateConversation as jest.Mock).mockResolvedValue(undefined);
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('MultiDatasetFilters', () => {
  describe('component initialization', () => {
    it('does not initialize filters when structure data is not ready', async () => {
      mockIsStructureDataMapsReady.mockReturnValue(false);

      await act(async () => {
        render(createElement(MultiDatasetFilters, defaultProps));
      });

      expect(mockGetFiltersPreselectedByDataQueries).not.toHaveBeenCalled();
    });

    it('calls getFiltersPreselectedByDataQueries once structure data maps are ready', async () => {
      mockIsStructureDataMapsReady.mockReturnValue(true);
      mockGetFiltersPreselectedByDataQueries.mockReturnValue([]);
      mockGetFiltersByConstraints.mockReturnValue([]);

      await act(async () => {
        render(createElement(MultiDatasetFilters, defaultProps));
        await Promise.resolve();
      });

      expect(mockGetFiltersPreselectedByDataQueries).toHaveBeenCalledWith(
        expect.any(Map),
        defaultProps.dataQueries,
        expect.anything(),
        expect.any(Object),
      );
    });

    it('keeps existing constraints for datasets whose refresh request fails', async () => {
      const initialConstraintsA = [{ id: 'initial-a' }] as any[];
      const initialConstraintsB = [{ id: 'initial-b' }] as any[];
      const updatedConstraintsA = [{ id: 'updated-a' }] as any[];
      const fulfilledConstraintData = {
        urn: DATASET_A_URN,
        data: { data: { dataConstraints: updatedConstraintsA } },
      };
      const initialConstraintsMap = new Map<string, any>([
        [DATASET_A_URN, initialConstraintsA],
        [DATASET_B_URN, initialConstraintsB],
      ]);
      const updatedConstraintsMap = new Map<string, any>([
        [DATASET_A_URN, updatedConstraintsA],
      ]);

      mockIsStructureDataMapsReady.mockReturnValue(true);
      mockGetFiltersPreselectedByDataQueries.mockReturnValue([
        makeSharedCountryFilter(),
      ]);
      mockGetConstraintsRequests.mockReturnValue([
        Promise.resolve(fulfilledConstraintData),
        Promise.reject(new Error('constraints failed')),
      ]);
      mockGetConstraintsMapFromSettledResults.mockReturnValue(
        updatedConstraintsMap,
      );

      await act(async () => {
        render(
          createElement(MultiDatasetFilters, {
            ...defaultProps,
            structureDataMaps: {
              ...defaultProps.structureDataMaps,
              constraintsMap: initialConstraintsMap,
            } as StructureDataMaps,
          }),
        );
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(mockGetConstraintsMapFromSettledResults).toHaveBeenCalledWith([
        expect.objectContaining({
          status: 'fulfilled',
          value: fulfilledConstraintData,
        }),
        expect.objectContaining({
          status: 'rejected',
        }),
      ]);

      const latestCall =
        mockGetFiltersByConstraints.mock.calls[
          mockGetFiltersByConstraints.mock.calls.length - 1
        ];
      const latestStructureDataMaps = latestCall[1] as StructureDataMaps;

      expect(latestStructureDataMaps.constraintsMap?.get(DATASET_A_URN)).toBe(
        updatedConstraintsA,
      );
      expect(latestStructureDataMaps.constraintsMap?.get(DATASET_B_URN)).toBe(
        initialConstraintsB,
      );
    });
  });

  describe('shared country filter handling', () => {
    it('initializes shared filters from data queries', async () => {
      const sharedCountryFilter = makeSharedCountryFilter();
      mockIsStructureDataMapsReady.mockReturnValue(true);
      mockGetFiltersPreselectedByDataQueries.mockReturnValue([
        sharedCountryFilter,
      ]);
      mockGetFiltersByConstraints.mockReturnValue([sharedCountryFilter]);

      await act(async () => {
        render(createElement(MultiDatasetFilters, defaultProps));
        await Promise.resolve();
      });

      expect(mockGetFiltersPreselectedByDataQueries).toHaveBeenCalledWith(
        expect.any(Map),
        defaultProps.dataQueries,
        defaultProps.structureDataMaps.constraintsMap,
        expect.any(Object),
      );

      expect(mockBuildFiltersMap).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: COMMON_COUNTRY_FILTER_ID,
            filterType: 'shared',
          }),
        ]),
        defaultProps.structureDataMaps.constraintsMap,
        true,
        expect.any(Object),
      );
    });

    it('applies shared filter fallback when applying cross-dataset filters', async () => {
      const onMultipleDataFiltersChange = jest.fn();
      const sharedCountryFilter = makeSharedCountryFilter();
      const expandedFiltersMap = new Map([
        [
          DATASET_A_URN,
          [
            {
              id: COMMON_COUNTRY_FILTER_ID,
              filterType: 'dataset',
              datasetUrn: DATASET_A_URN,
              dimensionValues: [],
            } as Filter,
          ],
        ],
        [
          DATASET_B_URN,
          [
            {
              id: COMMON_COUNTRY_FILTER_ID,
              filterType: 'dataset',
              datasetUrn: DATASET_B_URN,
              dimensionValues: [],
            } as Filter,
          ],
        ],
      ]);
      const queryFiltersMap = new Map<string, DatasetQueryFilters>([
        [DATASET_A_URN, { filterKey: null, timeFilter: null }],
        [DATASET_B_URN, { filterKey: null, timeFilter: null }],
      ]);

      mockIsStructureDataMapsReady.mockReturnValue(true);
      mockGetFiltersPreselectedByDataQueries.mockReturnValue([
        sharedCountryFilter,
      ]);
      mockGetFiltersByConstraints.mockReturnValue([sharedCountryFilter]);
      mockBuildFiltersMap.mockReturnValue(expandedFiltersMap);
      mockGetQueryFiltersMap.mockReturnValue(queryFiltersMap);

      const props = { ...defaultProps, onMultipleDataFiltersChange };

      await act(async () => {
        render(createElement(MultiDatasetFilters, props));
        await Promise.resolve();
      });

      // Open modal so modal filters are set to applied filters
      await act(async () => {
        mockCallbacks.setModalState?.('opened');
      });

      mockBuildFiltersMap.mockClear();

      // Click Apply — this should expand the shared filter and call onMultipleDataFiltersChange
      await act(async () => {
        mockCallbacks.onApply?.();
        await Promise.resolve();
      });

      expect(mockBuildFiltersMap).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: COMMON_COUNTRY_FILTER_ID,
            filterType: 'shared',
          }),
        ]),
        defaultProps.structureDataMaps.constraintsMap,
        true,
        expect.any(Object),
      );

      expect(onMultipleDataFiltersChange).toHaveBeenCalledWith(
        queryFiltersMap,
        expect.anything(),
        defaultProps.dataQueries,
        expect.any(Map),
      );
    });

    it('updates conversation with system message after applying filters', async () => {
      const sharedCountryFilter = makeSharedCountryFilter();
      const expandedFiltersMap = new Map([
        [
          DATASET_A_URN,
          [{ id: COMMON_COUNTRY_FILTER_ID, filterType: 'dataset' } as Filter],
        ],
      ]);

      mockIsStructureDataMapsReady.mockReturnValue(true);
      mockGetFiltersPreselectedByDataQueries.mockReturnValue([
        sharedCountryFilter,
      ]);
      mockGetFiltersByConstraints.mockReturnValue([sharedCountryFilter]);
      mockBuildFiltersMap.mockReturnValue(expandedFiltersMap);
      mockGetQueryFiltersMap.mockReturnValue(new Map());

      await act(async () => {
        render(createElement(MultiDatasetFilters, defaultProps));
        await Promise.resolve();
      });

      await act(async () => {
        mockCallbacks.setModalState?.('opened');
      });

      await act(async () => {
        mockCallbacks.onApply?.();
        await Promise.resolve();
      });

      expect(defaultProps.updateConversation).toHaveBeenCalledWith(
        'test-conversation',
        expect.objectContaining({
          messages: expect.any(Array),
        }),
      );
    });
  });

  describe('filter button state', () => {
    it('displays selected filter count correctly', async () => {
      const filterWithSelection = makeSharedCountryFilter();
      mockIsStructureDataMapsReady.mockReturnValue(true);
      mockGetFiltersPreselectedByDataQueries.mockReturnValue([
        filterWithSelection,
      ]);
      mockGetFiltersByConstraints.mockReturnValue([filterWithSelection]);

      await act(async () => {
        render(createElement(MultiDatasetFilters, defaultProps));
        await Promise.resolve();
      });

      expect(mockCallbacks.selectedFiltersCount).toBe(1);
    });
  });

  describe('single filter reset', () => {
    it('preserves constraints for untouched datasets when clearing one dataset filter', async () => {
      const datasetFilterA: Filter = {
        id: 'COUNTRY',
        title: 'Country',
        filterType: 'dataset',
        datasetUrn: DATASET_A_URN,
        dimensionValues: [{ id: 'FR', name: 'France', isSelectedValue: true }],
      };
      const datasetFilterB: Filter = {
        id: 'FREQUENCY',
        title: 'Frequency',
        filterType: 'dataset',
        datasetUrn: DATASET_B_URN,
        dimensionValues: [{ id: 'M', name: 'Monthly', isSelectedValue: true }],
      };
      const initialConstraintsA = [{ id: 'initial-a' }] as any[];
      const initialConstraintsB = [{ id: 'initial-b' }] as any[];
      const updatedConstraintsA = [{ id: 'updated-a' }] as any[];

      const initialConstraintsMap = new Map<string, any>([
        [DATASET_A_URN, initialConstraintsA],
        [DATASET_B_URN, initialConstraintsB],
      ]);
      const updatedConstraintsMap = new Map<string, any>([
        [DATASET_A_URN, updatedConstraintsA],
      ]);
      const filtersMap = new Map<string, Filter[]>([
        [DATASET_A_URN, [datasetFilterA]],
        [DATASET_B_URN, [datasetFilterB]],
      ]);

      mockIsStructureDataMapsReady.mockReturnValue(true);
      mockGetFiltersPreselectedByDataQueries.mockReturnValue([
        datasetFilterA,
        datasetFilterB,
      ]);
      mockBuildFiltersMap.mockReturnValue(filtersMap);
      mockGetFiltersByConstraints.mockReturnValue([
        datasetFilterA,
        datasetFilterB,
      ]);
      mockGetConstraintsRequests.mockReturnValue([]);
      mockGetConstraintsMapFromSettledResults
        .mockReturnValueOnce(initialConstraintsMap)
        .mockReturnValueOnce(updatedConstraintsMap);

      const props = {
        ...defaultProps,
        structureDataMaps: {
          ...defaultProps.structureDataMaps,
          constraintsMap: initialConstraintsMap,
        } as StructureDataMaps,
      };

      await act(async () => {
        render(createElement(MultiDatasetFilters, props));
        await Promise.resolve();
      });

      await act(async () => {
        mockCallbacks.setModalState?.('opened');
        await Promise.resolve();
      });

      await act(async () => {
        mockCallbacks.onDeleteFilter?.(datasetFilterA);
        await Promise.resolve();
      });

      expect(mockGetConstraintsRequests).toHaveBeenNthCalledWith(
        2,
        [props.dataQueries[0]],
        filtersMap,
        props.actions,
      );

      const latestCall =
        mockGetFiltersByConstraints.mock.calls[
          mockGetFiltersByConstraints.mock.calls.length - 1
        ];
      const latestStructureDataMaps = latestCall[1] as StructureDataMaps;

      expect(latestStructureDataMaps.constraintsMap?.get(DATASET_A_URN)).toBe(
        updatedConstraintsA,
      );
      expect(latestStructureDataMaps.constraintsMap?.get(DATASET_B_URN)).toBe(
        initialConstraintsB,
      );
    });
  });
});
