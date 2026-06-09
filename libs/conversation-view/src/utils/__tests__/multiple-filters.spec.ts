import {
  COMMON_COUNTRY_FILTER_ID,
  COMMON_FREQUENCY_FILTER_ID,
  COMMON_TIME_PERIOD_FILTER_ID,
  buildFiltersMap,
  filterSharedValuesForEnabledDatasets,
  getConstraintsMap,
  getConstraintsMapFromSettledResults,
  getConstraintsRequests,
  getCompatibleDatasetUrns,
  getDataQueriesWithExpandedSharedDimensionFilters,
  getDatasetNameFromFilters,
  getFilledDatasetFiltersMap,
  getFiltersByConstraints,
  getFiltersForQueryContext,
  getFiltersPreselectedByDataQueries,
  getImplicitSharedWildcardFilterParams,
  getNativeFilterIdForSharedFilter,
  getRestoredActiveDatasetUrns,
  getSharedFilterIdForDatasetDimension,
  hasImplicitSharedWildcard,
  isStructureDataMapsReady,
  mergeConstraintsMaps,
} from '../multiple-filters';
import type { Filter, SharedFilter } from '../../models/filters';
import { DatasetFilter, FilterValue } from '../../models/filters';
import { DataQuery, QueryFilterType } from '@epam/statgpt-shared-toolkit';

const mockFindCodelistByDimension = jest.fn();
const mockGenerateShortUrn = jest.fn(
  (name: string, version: string, agencyId: string) =>
    `${agencyId}:${name}(${version})`,
);
const mockGetAvailableCodesFromConstrains = jest.fn(() => [] as any[]);
const mockGetDatasetFilters = jest.fn(() => [] as Filter[]);
const mockGetFiltersPreselectedByDataQuery = jest.fn(
  (filters: Filter[]) => filters,
);
const mockGetFilledFilters = jest.fn((filters: Filter[]) => filters);
const mockGetQueryFilters = jest.fn(() => ({}));
const mockGetSeriesFilterDto = jest.fn(() => [] as any[]);
const mockGetAnnotationPeriod = jest.fn(() => ({
  startPeriod: null,
  endPeriod: null,
}));

jest.mock('@epam/statgpt-sdmx-toolkit', () => ({
  findCodelistByDimension: (...args: any[]) =>
    (mockFindCodelistByDimension as any)(...args),
  generateShortUrn: (...args: any[]) => (mockGenerateShortUrn as any)(...args),
  getAnnotationPeriod: (...args: any[]) =>
    (mockGetAnnotationPeriod as any)(...args),
  getAvailableCodesFromConstrains: (...args: any[]) =>
    (mockGetAvailableCodesFromConstrains as any)(...args),
  TIME_PERIOD: 'TIME_PERIOD',
  TIME_PERIOD_START_ANNOTATION_KEY: 'TIME_PERIOD_START',
  TIME_PERIOD_END_ANNOTATION_KEY: 'TIME_PERIOD_END',
}));

jest.mock('../filters', () => ({
  getDatasetFilters: (...args: any[]) =>
    (mockGetDatasetFilters as any)(...args),
  getFiltersPreselectedByDataQuery: (...args: any[]) =>
    (mockGetFiltersPreselectedByDataQuery as any)(...args),
}));

jest.mock('../get-filled-filters', () => ({
  getFilledFilters: (...args: any[]) => (mockGetFilledFilters as any)(...args),
}));

jest.mock('../get-series-filters', () => ({
  getSeriesFilterDto: (...args: any[]) =>
    (mockGetSeriesFilterDto as any)(...args),
}));

jest.mock('../normalize-constraint-filters', () => ({
  normalizeConstraintFilters: jest.fn((filters: unknown[]) => filters),
}));

jest.mock('../request-cache', () => ({
  buildRequestCacheKey: jest.fn(() => 'key'),
  getCachedRequestResult: jest.fn(
    (_fn: unknown, _key: unknown, getter: () => unknown) => getter(),
  ),
}));

jest.mock('../query-filters', () => ({
  getQueryFilters: (...args: any[]) => (mockGetQueryFilters as any)(...args),
  setDataQueryFilters: jest.fn(() => []),
}));

const DATASET_A_URN = 'AGENCY:DF_A(1.0)';
const DATASET_B_URN = 'AGENCY:DF_B(1.0)';
const DATASET_DIMENSIONS_METADATA_MAP = {
  [DATASET_A_URN]: {
    FREQ: {
      subtype: 'FREQUENCY',
      dimensionType: 'NON_INDICATOR',
    },
    REF_AREA: {
      subtype: 'REGION',
      dimensionType: 'NON_INDICATOR',
    },
    TIME_PERIOD: {
      dimensionType: 'TIME_PERIOD',
    },
  },
  [DATASET_B_URN]: {
    FREQUENCY: {
      subtype: 'FREQUENCY',
      dimensionType: 'NON_INDICATOR',
    },
    COUNTRY: {
      subtype: 'REGION',
      dimensionType: 'NON_INDICATOR',
    },
    TIME_PERIOD: {
      dimensionType: 'TIME_PERIOD',
    },
  },
} as any;

// ─── Default mock reset ───────────────────────────────────────────────────────

beforeEach(() => {
  mockGenerateShortUrn.mockImplementation(
    (name: string, version: string, agencyId: string) =>
      `${agencyId}:${name}(${version})`,
  );
  mockFindCodelistByDimension.mockReset();
  mockFindCodelistByDimension.mockReturnValue(undefined);
  mockGetAvailableCodesFromConstrains.mockReset();
  mockGetAvailableCodesFromConstrains.mockReturnValue([]);
  mockGetDatasetFilters.mockReset();
  mockGetDatasetFilters.mockReturnValue([]);
  mockGetFiltersPreselectedByDataQuery.mockReset();
  mockGetFiltersPreselectedByDataQuery.mockImplementation(
    (filters: Filter[]) => filters,
  );
  mockGetFilledFilters.mockReset();
  mockGetFilledFilters.mockImplementation((filters: Filter[]) => filters);
  mockGetQueryFilters.mockReset();
  mockGetQueryFilters.mockReturnValue({});
  mockGetSeriesFilterDto.mockReset();
  mockGetSeriesFilterDto.mockReturnValue([]);
});

describe('getSharedFilterIdForDatasetDimension', () => {
  it('maps native dataset frequency and region dimensions to shared filter ids', () => {
    expect(
      getSharedFilterIdForDatasetDimension(
        DATASET_A_URN,
        'FREQ',
        DATASET_DIMENSIONS_METADATA_MAP,
      ),
    ).toBe(COMMON_FREQUENCY_FILTER_ID);
    expect(
      getSharedFilterIdForDatasetDimension(
        DATASET_A_URN,
        'REF_AREA',
        DATASET_DIMENSIONS_METADATA_MAP,
      ),
    ).toBe(COMMON_COUNTRY_FILTER_ID);
  });

  it('maps time dimensions to the shared time period filter id', () => {
    expect(
      getSharedFilterIdForDatasetDimension(
        DATASET_A_URN,
        'TIME_PERIOD',
        DATASET_DIMENSIONS_METADATA_MAP,
      ),
    ).toBe(COMMON_TIME_PERIOD_FILTER_ID);
  });

  it('falls back to common shared ids when metadata is unavailable', () => {
    expect(getSharedFilterIdForDatasetDimension(undefined, 'FREQUENCY')).toBe(
      COMMON_FREQUENCY_FILTER_ID,
    );
  });
});

describe('getNativeFilterIdForSharedFilter', () => {
  it('resolves a shared filter to the native dimension id per dataset via subtype', () => {
    const sharedFilter = {
      id: COMMON_FREQUENCY_FILTER_ID,
      filterType: 'shared',
    } as SharedFilter;

    expect(
      getNativeFilterIdForSharedFilter(
        sharedFilter,
        DATASET_A_URN,
        DATASET_DIMENSIONS_METADATA_MAP,
      ),
    ).toBe('FREQ');
    expect(
      getNativeFilterIdForSharedFilter(
        sharedFilter,
        DATASET_B_URN,
        DATASET_DIMENSIONS_METADATA_MAP,
      ),
    ).toBe('FREQUENCY');
  });

  it('prefers an explicit per-dataset source filter id mapping', () => {
    const sharedFilter = {
      id: COMMON_COUNTRY_FILTER_ID,
      filterType: 'shared',
      sourceFilterIdsByDataset: { [DATASET_A_URN]: 'REF_AREA' },
    } as unknown as SharedFilter;

    expect(
      getNativeFilterIdForSharedFilter(
        sharedFilter,
        DATASET_A_URN,
        DATASET_DIMENSIONS_METADATA_MAP,
      ),
    ).toBe('REF_AREA');
  });

  it('returns undefined when the dataset has no matching dimension', () => {
    const sharedFilter = {
      id: COMMON_FREQUENCY_FILTER_ID,
      filterType: 'shared',
    } as SharedFilter;

    expect(
      getNativeFilterIdForSharedFilter(sharedFilter, 'UNKNOWN:DF(1.0)'),
    ).toBeUndefined();
  });
});

const makeDatasetCountryFilter = (
  datasetUrn: string,
  values: Array<{ id: string; name?: string; isSelectedValue?: boolean }>,
  filterId = COMMON_COUNTRY_FILTER_ID,
): Filter => ({
  id: filterId,
  filterType: 'dataset',
  datasetUrn,
  dimensionValues: values.map((v) => ({
    id: v.id,
    name: v.name,
    isSelectedValue: v.isSelectedValue ?? false,
  })),
});

// ─── merging country filters from multiple datasets ───────────────────────────

describe('merging country filters from multiple datasets', () => {
  const dataQueries = [{ urn: DATASET_A_URN }, { urn: DATASET_B_URN }] as any[];

  const countryFilterA = makeDatasetCountryFilter(DATASET_A_URN, [
    { id: 'FR', name: 'France', isSelectedValue: true },
    { id: 'DE', name: 'Germany', isSelectedValue: false },
  ]);
  const countryFilterB = makeDatasetCountryFilter(DATASET_B_URN, [
    { id: 'FRA', name: 'France', isSelectedValue: false },
    { id: 'ESP', name: 'Spain', isSelectedValue: true },
  ]);
  const filtersMap = new Map([
    [DATASET_A_URN, [countryFilterA]],
    [DATASET_B_URN, [countryFilterB]],
  ]);

  let result: Filter[];

  beforeEach(() => {
    result = getFiltersPreselectedByDataQueries(filtersMap, dataQueries);
  });

  it('produces a single shared filter instead of two separate dataset filters', () => {
    const countryFilters = result.filter(
      (f) => f.id === COMMON_COUNTRY_FILTER_ID,
    );
    expect(countryFilters).toHaveLength(1);
    expect(countryFilters[0].filterType).toBe('shared');
  });

  it('deduplicates values with the same name across datasets', () => {
    const sharedFilter = result.find((f) => f.id === COMMON_COUNTRY_FILTER_ID)!;
    const franceValues = sharedFilter.dimensionValues?.filter(
      (v) => v.name?.toLowerCase() === 'france',
    );
    expect(franceValues).toHaveLength(1);
  });

  it('includes values from all datasets in the merged filter', () => {
    const sharedFilter = result.find((f) => f.id === COMMON_COUNTRY_FILTER_ID)!;
    const names = sharedFilter.dimensionValues?.map((v) =>
      v.name?.toLowerCase(),
    );
    expect(names).toContain('france');
    expect(names).toContain('germany');
    expect(names).toContain('spain');
  });

  it('OR-combines isSelectedValue: a value selected in any dataset is marked selected', () => {
    const sharedFilter = result.find((f) => f.id === COMMON_COUNTRY_FILTER_ID)!;

    // France: selected in A (true) + not selected in B (false) → should be true
    const franceValue = sharedFilter.dimensionValues?.find(
      (v) => v.name?.toLowerCase() === 'france',
    );
    expect(franceValue?.isSelectedValue).toBe(true);

    // Germany: not selected in A → should be false
    const germanyValue = sharedFilter.dimensionValues?.find(
      (v) => v.name?.toLowerCase() === 'germany',
    );
    expect(germanyValue?.isSelectedValue).toBe(false);
  });

  it('tracks the per-dataset origin in sourceValues for each merged value', () => {
    const sharedFilter = result.find((f) => f.id === COMMON_COUNTRY_FILTER_ID)!;
    const franceValue = sharedFilter.dimensionValues?.find(
      (v) => v.name?.toLowerCase() === 'france',
    );

    expect(franceValue?.sourceValues).toHaveLength(2);
    expect(franceValue?.sourceValues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ datasetUrn: DATASET_A_URN, id: 'FR' }),
        expect.objectContaining({ datasetUrn: DATASET_B_URN, id: 'FRA' }),
      ]),
    );
  });

  it('records all contributing dataset URNs in sourceDatasetUrns', () => {
    const sharedFilter = result.find(
      (f) => f.id === COMMON_COUNTRY_FILTER_ID,
    ) as SharedFilter;
    expect(sharedFilter.sourceDatasetUrns).toEqual(
      expect.arrayContaining([DATASET_A_URN, DATASET_B_URN]),
    );
  });

  it('does not deduplicate values with the same id when both names are missing', () => {
    const filterA = makeDatasetCountryFilter(DATASET_A_URN, [
      { id: 'X', name: undefined, isSelectedValue: false },
    ]);
    const filterB = makeDatasetCountryFilter(DATASET_B_URN, [
      { id: 'X', name: undefined, isSelectedValue: true },
    ]);
    const merged = getFiltersPreselectedByDataQueries(
      new Map([
        [DATASET_A_URN, [filterA]],
        [DATASET_B_URN, [filterB]],
      ]),
      dataQueries,
    );
    const sharedFilter = merged.find((f) => f.id === COMMON_COUNTRY_FILTER_ID)!;

    // Two separate entries because keys fall back to dataset+id (different datasetUrns)
    expect(sharedFilter.dimensionValues).toHaveLength(2);
  });

  it('passes non-shared filters through without merging', () => {
    const nonSharedFilter: Filter = {
      id: 'INDICATOR',
      filterType: 'dataset',
      datasetUrn: DATASET_A_URN,
      dimensionValues: [{ id: 'GDP', name: 'GDP', isSelectedValue: false }],
    };
    const filtersWithNonShared = new Map([
      [DATASET_A_URN, [countryFilterA, nonSharedFilter]],
      [DATASET_B_URN, [countryFilterB]],
    ]);
    const merged = getFiltersPreselectedByDataQueries(
      filtersWithNonShared,
      dataQueries,
    );

    // 1 shared COUNTRY + 1 dataset INDICATOR
    expect(merged).toHaveLength(2);
    const indicator = merged.find((f) => f.id === 'INDICATOR');
    expect(indicator?.filterType).toBe('dataset');
  });
});

describe('merging shared filters by subtype', () => {
  it('merges region filters even when dataset ids differ', () => {
    const merged = getFiltersPreselectedByDataQueries(
      new Map([
        [
          DATASET_A_URN,
          [
            makeDatasetCountryFilter(
              DATASET_A_URN,
              [{ id: 'FR', name: 'France', isSelectedValue: true }],
              'REF_AREA',
            ),
          ],
        ],
        [
          DATASET_B_URN,
          [
            makeDatasetCountryFilter(
              DATASET_B_URN,
              [{ id: 'FRA', name: 'France', isSelectedValue: false }],
              'COUNTRY',
            ),
          ],
        ],
      ]),
      [{ urn: DATASET_A_URN }, { urn: DATASET_B_URN }] as any[],
      undefined,
      DATASET_DIMENSIONS_METADATA_MAP,
    );

    const sharedCountry = merged.find((f) => f.id === COMMON_COUNTRY_FILTER_ID);
    expect(sharedCountry?.filterType).toBe('shared');
    expect((sharedCountry as SharedFilter).sourceFilterIdsByDataset).toEqual({
      [DATASET_A_URN]: 'REF_AREA',
      [DATASET_B_URN]: 'COUNTRY',
    });
  });
});

// ─── expanding shared country filter back to per-dataset filters ─────────────

describe('expanding shared country filter back to per-dataset filters', () => {
  const sharedCountryFilter: Filter = {
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
        sourceValues: [
          { datasetUrn: DATASET_A_URN, id: 'DE', name: 'Germany' },
        ],
      },
    ],
  };

  let filtersMap: Map<string, Filter[]>;

  beforeEach(() => {
    filtersMap = buildFiltersMap([sharedCountryFilter]);
  });

  it('creates a separate filter entry for each source dataset', () => {
    expect(filtersMap.has(DATASET_A_URN)).toBe(true);
    expect(filtersMap.has(DATASET_B_URN)).toBe(true);
  });

  it('restores the original per-dataset value ids from sourceValues', () => {
    const datasetAFilters = filtersMap.get(DATASET_A_URN)!;
    const countryFilter = datasetAFilters.find(
      (f) => f.id === COMMON_COUNTRY_FILTER_ID,
    )!;
    const ids = countryFilter.dimensionValues?.map((v) => v.id);

    expect(ids).toContain('FR');
    expect(ids).toContain('DE');
    expect(ids).not.toContain('name:france'); // merged key must not leak through
  });

  it('propagates the merged selection state to all source datasets', () => {
    // France was selected in the merged filter — this should carry to Dataset B
    const datasetBFilters = filtersMap.get(DATASET_B_URN)!;
    const countryFilter = datasetBFilters.find(
      (f) => f.id === COMMON_COUNTRY_FILTER_ID,
    )!;
    const france = countryFilter.dimensionValues?.find((v) => v.id === 'FRA');

    expect(france?.isSelectedValue).toBe(true);
  });

  it('sets filterType to "dataset" for every expanded filter', () => {
    const allFilters = [
      ...(filtersMap.get(DATASET_A_URN) ?? []),
      ...(filtersMap.get(DATASET_B_URN) ?? []),
    ];
    expect(allFilters.every((f) => f.filterType === 'dataset')).toBe(true);
  });
});

// ─── merge-then-expand round-trip ────────────────────────────────────────────

describe('merge-then-expand round-trip preserves original structure', () => {
  const countryFilterA = makeDatasetCountryFilter(DATASET_A_URN, [
    { id: 'FR', name: 'France', isSelectedValue: true },
    { id: 'DE', name: 'Germany', isSelectedValue: false },
  ]);
  const countryFilterB = makeDatasetCountryFilter(DATASET_B_URN, [
    { id: 'FRA', name: 'France', isSelectedValue: false },
    { id: 'ESP', name: 'Spain', isSelectedValue: true },
  ]);
  const dataQueries = [{ urn: DATASET_A_URN }, { urn: DATASET_B_URN }] as any[];
  const filtersMap = new Map([
    [DATASET_A_URN, [countryFilterA]],
    [DATASET_B_URN, [countryFilterB]],
  ]);

  it('restores original per-dataset value ids after merge and expand', () => {
    const merged = getFiltersPreselectedByDataQueries(filtersMap, dataQueries);
    const expanded = buildFiltersMap(merged);

    const dsAIds = expanded
      .get(DATASET_A_URN)
      ?.find((f) => f.id === COMMON_COUNTRY_FILTER_ID)
      ?.dimensionValues?.map((v) => v.id);
    expect(dsAIds).toEqual(expect.arrayContaining(['FR', 'DE']));

    const dsBIds = expanded
      .get(DATASET_B_URN)
      ?.find((f) => f.id === COMMON_COUNTRY_FILTER_ID)
      ?.dimensionValues?.map((v) => v.id);
    expect(dsBIds).toEqual(expect.arrayContaining(['FRA', 'ESP']));
  });

  it('propagates selection across datasets: selecting in one dataset selects in all', () => {
    // France selected in A, not in B → after round-trip, B should also have it selected
    const merged = getFiltersPreselectedByDataQueries(filtersMap, dataQueries);
    const expanded = buildFiltersMap(merged);

    const franceBValue = expanded
      .get(DATASET_B_URN)
      ?.find((f) => f.id === COMMON_COUNTRY_FILTER_ID)
      ?.dimensionValues?.find((v) => v.id === 'FRA');
    expect(franceBValue?.isSelectedValue).toBe(true);
  });
});

// ─── getFiltersForQueryContext ────────────────────────────────────────────────

describe('getFiltersForQueryContext', () => {
  const sharedCountryFilter: Filter = {
    id: COMMON_COUNTRY_FILTER_ID,
    filterType: 'shared',
    sourceDatasetUrns: [DATASET_A_URN, DATASET_B_URN],
    dimensionValues: [
      {
        id: 'name:france',
        name: 'France',
        isSelectedValue: true,
        sourceValues: [
          { datasetUrn: DATASET_A_URN, id: 'FR' },
          { datasetUrn: DATASET_B_URN, id: 'FRA' },
        ],
      },
    ],
  };

  const datasetFilterA: Filter = {
    id: 'INDICATOR',
    filterType: 'dataset',
    datasetUrn: DATASET_A_URN,
    dimensionValues: [{ id: 'GDP', name: 'GDP', isSelectedValue: false }],
  };

  it('returns expanded dataset-specific filters when a datasetUrn is provided', () => {
    const filters = getFiltersForQueryContext(
      [sharedCountryFilter, datasetFilterA],
      DATASET_A_URN,
    );

    expect(filters).toHaveLength(2); // expanded COUNTRY + INDICATOR for dataset A
    expect(filters.every((f) => f.filterType === 'dataset')).toBe(true);
    expect(filters.every((f) => f.datasetUrn === DATASET_A_URN)).toBe(true);
  });

  it('returns only non-shared filters when no datasetUrn is provided', () => {
    const filters = getFiltersForQueryContext([
      sharedCountryFilter,
      datasetFilterA,
    ]);

    expect(filters).toHaveLength(1);
    expect(filters[0].id).toBe('INDICATOR');
  });

  it('returns an empty array when the specified dataset has no matching filters', () => {
    const filters = getFiltersForQueryContext([datasetFilterA], DATASET_B_URN);
    expect(filters).toHaveLength(0);
  });
});

// ─── isStructureDataMapsReady ─────────────────────────────────────────────────

describe('isStructureDataMapsReady', () => {
  const validMaps = {
    dimensionsMap: new Map(),
    structuresMap: new Map(),
    structureDimensionsMap: new Map(),
    constraintsMap: new Map(),
  };

  it('returns false when dataQueries is empty', () => {
    expect(isStructureDataMapsReady([], validMaps)).toBe(false);
  });

  it('returns false when dataQueries is undefined', () => {
    expect(isStructureDataMapsReady(undefined, validMaps)).toBe(false);
  });

  it('returns false when constraintsMap is missing', () => {
    expect(
      isStructureDataMapsReady([{ urn: 'x' } as any], {
        ...validMaps,
        constraintsMap: undefined,
      }),
    ).toBe(false);
  });

  it('returns false when dimensionsMap is missing', () => {
    expect(
      isStructureDataMapsReady([{ urn: 'x' } as any], {
        ...validMaps,
        dimensionsMap: undefined,
      }),
    ).toBe(false);
  });

  it('returns false when structuresMap is missing', () => {
    expect(
      isStructureDataMapsReady([{ urn: 'x' } as any], {
        ...validMaps,
        structuresMap: undefined,
      }),
    ).toBe(false);
  });

  it('returns false when structureDimensionsMap is missing', () => {
    expect(
      isStructureDataMapsReady([{ urn: 'x' } as any], {
        ...validMaps,
        structureDimensionsMap: undefined,
      }),
    ).toBe(false);
  });

  it('returns true when all maps are present and dataQueries is non-empty', () => {
    expect(isStructureDataMapsReady([{ urn: 'x' } as any], validMaps)).toBe(
      true,
    );
  });
});

describe('datasets with missing constraints entries', () => {
  it('does not fill initial values from codelist when a dataset constraints request failed', () => {
    mockGetDatasetFilters.mockImplementation(
      (
        _dimensions: unknown,
        _structures: unknown,
        _structureDimensions: unknown,
        _locale: unknown,
        datasetUrn: string,
      ) => [
        {
          id: 'FREQ',
          filterType: 'dataset',
          datasetUrn,
          dimensionValues: [],
        } as Filter,
      ],
    );
    mockFindCodelistByDimension.mockReturnValue({
      codes: [{ id: 'A', name: 'Annual' }],
    });
    mockGetAvailableCodesFromConstrains.mockReturnValue([
      { id: 'A', name: 'Annual' },
    ]);

    const result = getFilledDatasetFiltersMap({
      dimensionsMap: new Map([
        [DATASET_A_URN, [{ id: 'FREQ' }]],
        [DATASET_B_URN, [{ id: 'FREQ' }]],
      ]),
      structuresMap: new Map([
        [DATASET_A_URN, {}],
        [DATASET_B_URN, {}],
      ]),
      structureDimensionsMap: new Map(),
      constraintsMap: new Map([[DATASET_A_URN, []]]),
    } as any);

    expect(result.get(DATASET_A_URN)?.[0].dimensionValues).toEqual([
      { id: 'A', name: 'Annual' },
    ]);
    expect(result.get(DATASET_B_URN)?.[0].dimensionValues).toEqual([]);
    expect(mockGetAvailableCodesFromConstrains).toHaveBeenCalledTimes(1);
  });

  it('does not fill initial values from constraints when a dataset data request failed', () => {
    mockGetDatasetFilters.mockImplementation(
      (
        _dimensions: unknown,
        _structures: unknown,
        _structureDimensions: unknown,
        _locale: unknown,
        datasetUrn: string,
      ) => [
        {
          id: 'FREQ',
          filterType: 'dataset',
          datasetUrn,
          dimensionValues: [],
        } as Filter,
      ],
    );
    mockFindCodelistByDimension.mockReturnValue({
      codes: [{ id: 'A', name: 'Annual' }],
    });
    mockGetAvailableCodesFromConstrains.mockReturnValue([
      { id: 'A', name: 'Annual' },
    ]);

    const result = getFilledDatasetFiltersMap({
      dataMessagesMap: new Map([[DATASET_A_URN, {}]]),
      dimensionsMap: new Map([
        [DATASET_A_URN, [{ id: 'FREQ' }]],
        [DATASET_B_URN, [{ id: 'FREQ' }]],
      ]),
      structuresMap: new Map([
        [DATASET_A_URN, {}],
        [DATASET_B_URN, {}],
      ]),
      structureDimensionsMap: new Map(),
      constraintsMap: new Map([
        [DATASET_A_URN, []],
        [DATASET_B_URN, []],
      ]),
    } as any);

    expect(result.get(DATASET_A_URN)?.[0].dimensionValues).toEqual([
      { id: 'A', name: 'Annual' },
    ]);
    expect(result.get(DATASET_B_URN)?.[0].dimensionValues).toEqual([]);
    expect(mockGetAvailableCodesFromConstrains).toHaveBeenCalledTimes(1);
  });

  it('keeps only selected values when refreshing filters for a dataset without constraints', () => {
    const datasetAFilter: Filter = {
      id: 'INDICATOR',
      filterType: 'dataset',
      datasetUrn: DATASET_A_URN,
      dimensionValues: [],
    };
    const datasetBFilter: Filter = {
      id: 'INDICATOR',
      filterType: 'dataset',
      datasetUrn: DATASET_B_URN,
      dimensionValues: [
        { id: 'GDP', name: 'GDP', isSelectedValue: true },
        { id: 'CPI', name: 'CPI', isSelectedValue: false },
      ],
    };

    mockGetFilledFilters.mockReturnValue([
      {
        ...datasetAFilter,
        dimensionValues: [{ id: 'A', name: 'Available' }],
      },
    ]);

    const result = getFiltersByConstraints(
      new Map([
        [DATASET_A_URN, [datasetAFilter]],
        [DATASET_B_URN, [datasetBFilter]],
      ]),
      {
        dimensionsMap: new Map([[DATASET_A_URN, [{ id: 'INDICATOR' }]]]),
        structuresMap: new Map([[DATASET_A_URN, {}]]),
        constraintsMap: new Map([[DATASET_A_URN, []]]),
      } as any,
    );

    expect(mockGetFilledFilters).toHaveBeenCalledTimes(1);
    expect(
      result.find((filter) => filter.datasetUrn === DATASET_B_URN)
        ?.dimensionValues,
    ).toEqual([{ id: 'GDP', name: 'GDP', isSelectedValue: true }]);
  });

  it('keeps only selected values when refreshing filters for a dataset without data response', () => {
    const datasetAFilter: Filter = {
      id: 'INDICATOR',
      filterType: 'dataset',
      datasetUrn: DATASET_A_URN,
      dimensionValues: [],
    };
    const datasetBFilter: Filter = {
      id: 'INDICATOR',
      filterType: 'dataset',
      datasetUrn: DATASET_B_URN,
      dimensionValues: [
        { id: 'GDP', name: 'GDP', isSelectedValue: true },
        { id: 'CPI', name: 'CPI', isSelectedValue: false },
      ],
    };

    mockGetFilledFilters.mockReturnValue([
      {
        ...datasetAFilter,
        dimensionValues: [{ id: 'A', name: 'Available' }],
      },
    ]);

    const result = getFiltersByConstraints(
      new Map([
        [DATASET_A_URN, [datasetAFilter]],
        [DATASET_B_URN, [datasetBFilter]],
      ]),
      {
        dataMessagesMap: new Map([[DATASET_A_URN, {}]]),
        dimensionsMap: new Map([
          [DATASET_A_URN, [{ id: 'INDICATOR' }]],
          [DATASET_B_URN, [{ id: 'INDICATOR' }]],
        ]),
        structuresMap: new Map([
          [DATASET_A_URN, {}],
          [DATASET_B_URN, {}],
        ]),
        constraintsMap: new Map([
          [DATASET_A_URN, []],
          [DATASET_B_URN, []],
        ]),
      } as any,
    );

    expect(mockGetFilledFilters).toHaveBeenCalledTimes(1);
    expect(
      result.find((filter) => filter.datasetUrn === DATASET_B_URN)
        ?.dimensionValues,
    ).toEqual([{ id: 'GDP', name: 'GDP', isSelectedValue: true }]);
  });
});

// ─── getDatasetNameFromFilters ────────────────────────────────────────────────

describe('getDatasetNameFromFilters', () => {
  it('returns undefined for a shared filter', () => {
    const sharedFilter: Filter = {
      id: COMMON_COUNTRY_FILTER_ID,
      filterType: 'shared',
      sourceDatasetUrns: [DATASET_A_URN],
      dimensionValues: [],
    };
    expect(getDatasetNameFromFilters(sharedFilter)).toBeUndefined();
  });

  it('returns undefined for a dataset filter with no matching structure', () => {
    const datasetFilter: Filter = {
      id: 'INCOME',
      filterType: 'dataset',
      datasetUrn: DATASET_A_URN,
      dimensionValues: [],
    };
    expect(getDatasetNameFromFilters(datasetFilter, new Map())).toBeUndefined();
  });

  it('returns the generated short URN for a dataset filter with a matching structure', () => {
    const datasetFilter: Filter = {
      id: 'INCOME',
      filterType: 'dataset',
      datasetUrn: DATASET_A_URN,
      dimensionValues: [],
    };
    const structuresMap = new Map([
      [
        DATASET_A_URN,
        { dataflows: [{ name: 'DF_A', agencyID: 'AGENCY', version: '1.0' }] },
      ],
    ]) as any;

    // The impl calls generateShortUrn(name, '', agencyID) — version is intentionally empty.
    const result = getDatasetNameFromFilters(datasetFilter, structuresMap);
    expect(mockGenerateShortUrn).toHaveBeenCalledWith('DF_A', '', 'AGENCY');
    expect(result).toBe('AGENCY:DF_A()');
  });
});

// ─── getConstraintsMap ────────────────────────────────────────────────────────

describe('getConstraintsMap', () => {
  it('builds a map keyed by the short URN generated from each constraint', () => {
    const constraintsData = [
      {
        urn: 'AGENCY:DF_A(1.0)',
        data: {
          data: {
            dataConstraints: [
              { id: 'DF_A', version: '1.0', agencyID: 'AGENCY' },
            ],
          },
        },
      },
    ] as any[];

    const map = getConstraintsMap(constraintsData);
    expect(map.has('AGENCY:DF_A(1.0)')).toBe(true);
    expect(map.get('AGENCY:DF_A(1.0)')?.[0]).toMatchObject({
      id: 'DF_A',
      agencyID: 'AGENCY',
    });
  });

  it('does not create a dataset entry when constraints payload is missing', () => {
    const map = getConstraintsMap([
      {
        urn: DATASET_A_URN,
        data: {},
      },
      {
        urn: DATASET_B_URN,
        data: {
          data: {
            dataConstraints: [],
          },
        },
      },
    ] as any[]);

    expect(map.has(DATASET_A_URN)).toBe(false);
    expect(map.has(DATASET_B_URN)).toBe(true);
  });
});

describe('getConstraintsMapFromSettledResults', () => {
  it('builds constraints map from fulfilled results and ignores rejected results', () => {
    const constraints = [{ id: 'updated-a' }] as any[];

    const map = getConstraintsMapFromSettledResults([
      {
        status: 'fulfilled',
        value: {
          urn: DATASET_A_URN,
          data: {
            data: {
              dataConstraints: constraints,
            },
          },
        },
      },
      {
        status: 'rejected',
        reason: new Error('failed'),
      },
    ]);

    expect(map.get(DATASET_A_URN)).toBe(constraints);
    expect(map.has(DATASET_B_URN)).toBe(false);
  });
});

describe('mergeConstraintsMaps', () => {
  it('overrides only updated dataset entries and preserves the rest', () => {
    const initialConstraintsA = [{ id: 'initial-a' }] as any[];
    const initialConstraintsB = [{ id: 'initial-b' }] as any[];
    const updatedConstraintsA = [{ id: 'updated-a' }] as any[];

    const result = mergeConstraintsMaps(
      new Map([
        [DATASET_A_URN, initialConstraintsA],
        [DATASET_B_URN, initialConstraintsB],
      ]),
      new Map([[DATASET_A_URN, updatedConstraintsA]]),
    );

    expect(result.get(DATASET_A_URN)).toBe(updatedConstraintsA);
    expect(result.get(DATASET_B_URN)).toBe(initialConstraintsB);
  });

  it('creates a new map when there are no base constraints', () => {
    const updatedConstraintsA = [{ id: 'updated-a' }] as any[];

    const result = mergeConstraintsMaps(
      undefined,
      new Map([[DATASET_A_URN, updatedConstraintsA]]),
    );

    expect(result).toEqual(new Map([[DATASET_A_URN, updatedConstraintsA]]));
  });
});

// ─── FREQUENCY filter follows the same name-based merge strategy ─────────────

describe('merging frequency filters', () => {
  it('merges frequency filters from subtype metadata when dataset ids differ', () => {
    const freqFilterA: Filter = {
      id: 'FREQ',
      filterType: 'dataset',
      datasetUrn: DATASET_A_URN,
      dimensionValues: [
        { id: 'A', name: 'Annual', isSelectedValue: true },
        { id: 'Q', name: 'Quarterly', isSelectedValue: false },
      ],
    };
    const freqFilterB: Filter = {
      id: COMMON_FREQUENCY_FILTER_ID,
      filterType: 'dataset',
      datasetUrn: DATASET_B_URN,
      dimensionValues: [
        { id: 'ANNUAL', name: 'Annual', isSelectedValue: false },
        { id: 'M', name: 'Monthly', isSelectedValue: true },
      ],
    };

    const merged = getFiltersPreselectedByDataQueries(
      new Map([
        [DATASET_A_URN, [freqFilterA]],
        [DATASET_B_URN, [freqFilterB]],
      ]),
      [{ urn: DATASET_A_URN }, { urn: DATASET_B_URN }] as any[],
      undefined,
      DATASET_DIMENSIONS_METADATA_MAP,
    );

    const sharedFreq = merged.find((f) => f.id === COMMON_FREQUENCY_FILTER_ID)!;
    expect(sharedFreq.filterType).toBe('shared');

    // 'Annual' from both → deduplicated to 1 entry; 'Quarterly' + 'Monthly' = 2 more
    expect(sharedFreq.dimensionValues).toHaveLength(3);

    const annual = sharedFreq.dimensionValues?.find(
      (v) => v.name?.toLowerCase() === 'annual',
    );
    expect(annual?.isSelectedValue).toBe(true);
    expect(annual?.sourceValues).toHaveLength(2);
    expect((sharedFreq as SharedFilter).sourceFilterIdsByDataset).toEqual({
      [DATASET_A_URN]: 'FREQ',
      [DATASET_B_URN]: COMMON_FREQUENCY_FILTER_ID,
    });
  });
});

describe('implicit wildcard in getFiltersPreselectedByDataQueries', () => {
  it('selects all values for a missing shared dimension when a sibling has explicit values', () => {
    const freqFilterA: Filter = {
      id: 'FREQ',
      filterType: 'dataset',
      datasetUrn: DATASET_A_URN,
      dimensionValues: [
        { id: 'D', name: 'Daily', isSelectedValue: false },
        { id: 'M', name: 'Monthly', isSelectedValue: false },
        { id: 'Q', name: 'Quarterly', isSelectedValue: false },
        { id: 'A', name: 'Annual', isSelectedValue: false },
      ],
    };
    const freqFilterB: Filter = {
      id: COMMON_FREQUENCY_FILTER_ID,
      filterType: 'dataset',
      datasetUrn: DATASET_B_URN,
      dimensionValues: [
        { id: 'D', name: 'Daily', isSelectedValue: false },
        { id: 'M', name: 'Monthly', isSelectedValue: false },
      ],
    };
    mockGetFiltersPreselectedByDataQuery.mockImplementation(
      (filters: Filter[]) => filters,
    );
    const dataQueries = [
      {
        urn: DATASET_A_URN,
        filters: [
          {
            componentCode: 'FREQ',
            operator: QueryFilterType.IN,
            values: ['D'],
          },
        ],
      },
      { urn: DATASET_B_URN, filters: [] },
    ] as any;

    const merged = getFiltersPreselectedByDataQueries(
      new Map([
        [DATASET_A_URN, [freqFilterA]],
        [DATASET_B_URN, [freqFilterB]],
      ]),
      dataQueries,
      undefined,
      DATASET_DIMENSIONS_METADATA_MAP,
    );

    const sharedFreq = merged.find((f) => f.id === COMMON_FREQUENCY_FILTER_ID)!;
    expect(sharedFreq.filterType).toBe('shared');

    const monthly = sharedFreq.dimensionValues?.find(
      (v) => v.name === 'Monthly',
    );
    expect(monthly?.isSelectedValue).toBe(true);
    const daily = sharedFreq.dimensionValues?.find((v) => v.name === 'Daily');
    expect(daily?.isSelectedValue).toBe(true);
  });

  it('does not select all values for a shared dimension that already has an explicit filter', () => {
    const freqFilterA: Filter = {
      id: 'FREQ',
      filterType: 'dataset',
      datasetUrn: DATASET_A_URN,
      dimensionValues: [
        { id: 'D', name: 'Daily', isSelectedValue: false },
        { id: 'M', name: 'Monthly', isSelectedValue: false },
      ],
    };
    mockGetFiltersPreselectedByDataQuery.mockImplementation(
      (filters: Filter[]) => filters,
    );
    const dataQueries = [
      {
        urn: DATASET_A_URN,
        filters: [
          {
            componentCode: 'FREQ',
            operator: QueryFilterType.IN,
            values: ['D'],
          },
        ],
      },
    ] as any;

    const merged = getFiltersPreselectedByDataQueries(
      new Map([[DATASET_A_URN, [freqFilterA]]]),
      dataQueries,
      undefined,
      DATASET_DIMENSIONS_METADATA_MAP,
    );

    const freqFilter = merged.find(
      (f) => f.id === 'FREQ' || f.id === COMMON_FREQUENCY_FILTER_ID,
    )!;
    const monthly = freqFilter?.dimensionValues?.find(
      (v) => v.name === 'Monthly',
    );
    expect(monthly?.isSelectedValue).toBe(false);
  });

  it('does not select all values for a missing shared filter without a sibling explicit selection', () => {
    const freqFilter: Filter = {
      id: 'FREQ',
      filterType: 'dataset',
      datasetUrn: DATASET_A_URN,
      dimensionValues: [
        { id: 'D', name: 'Daily', isSelectedValue: false },
        { id: 'M', name: 'Monthly', isSelectedValue: false },
      ],
    };
    mockGetFiltersPreselectedByDataQuery.mockImplementation(
      (filters: Filter[]) => filters,
    );

    const merged = getFiltersPreselectedByDataQueries(
      new Map([[DATASET_A_URN, [freqFilter]]]),
      [{ urn: DATASET_A_URN, filters: [] }] as any,
      undefined,
      DATASET_DIMENSIONS_METADATA_MAP,
    );

    expect(
      merged[0].dimensionValues?.some((value) => value.isSelectedValue),
    ).toBe(false);
  });
});

describe('expanding shared filters with subtype metadata', () => {
  it('restores the native filter id for each dataset from metadata', () => {
    const sharedFreqFilter: Filter = {
      id: COMMON_FREQUENCY_FILTER_ID,
      filterType: 'shared',
      sourceDatasetUrns: [DATASET_A_URN, DATASET_B_URN],
      dimensionValues: [
        {
          id: 'name:annual',
          name: 'Annual',
          isSelectedValue: true,
          sourceValues: [
            { datasetUrn: DATASET_A_URN, id: 'A', name: 'Annual' },
            { datasetUrn: DATASET_B_URN, id: 'ANNUAL', name: 'Annual' },
          ],
        },
      ],
    };

    const filtersMap = buildFiltersMap(
      [sharedFreqFilter],
      undefined,
      false,
      DATASET_DIMENSIONS_METADATA_MAP,
    );

    expect(filtersMap.get(DATASET_A_URN)?.[0]?.id).toBe('FREQ');
    expect(filtersMap.get(DATASET_B_URN)?.[0]?.id).toBe(
      COMMON_FREQUENCY_FILTER_ID,
    );
  });
});

// ─── expandSharedFilter — datasets with no matching source values ─────────────

describe('shared filter expansion for datasets with no matching source values', () => {
  const sharedFreqFilter: Filter = {
    id: COMMON_FREQUENCY_FILTER_ID,
    filterType: 'shared',
    sourceDatasetUrns: [DATASET_A_URN, DATASET_B_URN],
    dimensionValues: [
      {
        id: 'name:quarterly',
        name: 'Quarterly',
        isSelectedValue: true,
        sourceValues: [
          { datasetUrn: DATASET_A_URN, id: 'Q', name: 'Quarterly' },
        ],
      },
      {
        id: 'name:annual',
        name: 'Annual',
        isSelectedValue: false,
        sourceValues: [
          { datasetUrn: DATASET_A_URN, id: 'A', name: 'Annual' },
          { datasetUrn: DATASET_B_URN, id: 'ANNUAL', name: 'Annual' },
        ],
      },
    ],
  };

  it('does not synthesize selected codes for datasets without matching source values', () => {
    const filtersMap = buildFiltersMap([sharedFreqFilter]);
    const dsBFilter = filtersMap
      .get(DATASET_B_URN)
      ?.find((f) => f.id === COMMON_FREQUENCY_FILTER_ID);

    expect(dsBFilter?.dimensionValues?.map((v) => v.id)).not.toContain(
      'name:quarterly',
    );
    expect(dsBFilter?.dimensionValues?.every((v) => !v.isSelectedValue)).toBe(
      true,
    );
  });

  it('does not apply fallback codes even when the legacy fallback flag is true', () => {
    const filtersMap = buildFiltersMap([sharedFreqFilter], undefined, true);
    const dsBFilter = filtersMap
      .get(DATASET_B_URN)
      ?.find((f) => f.id === COMMON_FREQUENCY_FILTER_ID);
    const ids = dsBFilter?.dimensionValues?.map((v) => v.id);

    expect(ids).not.toContain('Q');
    expect(ids).toEqual(['ANNUAL']);
    expect(
      dsBFilter?.dimensionValues?.find((v) => v.id === 'ANNUAL')
        ?.isSelectedValue,
    ).toBe(false);
  });

  it('preserves native source codes for datasets that already have matching values', () => {
    const filtersMap = buildFiltersMap([sharedFreqFilter], undefined, true);
    const dsAFilter = filtersMap
      .get(DATASET_A_URN)
      ?.find((f) => f.id === COMMON_FREQUENCY_FILTER_ID);
    const ids = dsAFilter?.dimensionValues?.map((v) => v.id);

    expect(ids).toContain('Q');
    expect(ids).toContain('A');
    expect(ids).not.toContain('name:quarterly');
  });

  it('does not apply fallback when nothing is selected', () => {
    const nothingSelectedFilter: Filter = {
      ...sharedFreqFilter,
      dimensionValues: sharedFreqFilter.dimensionValues?.map((v) => ({
        ...v,
        isSelectedValue: false,
      })),
    };
    const filtersMap = buildFiltersMap(
      [nothingSelectedFilter],
      undefined,
      true,
    );
    const dsBFilter = filtersMap
      .get(DATASET_B_URN)
      ?.find((f) => f.id === COMMON_FREQUENCY_FILTER_ID);

    expect(dsBFilter?.dimensionValues?.every((v) => !v.isSelectedValue)).toBe(
      true,
    );
    expect(dsBFilter?.dimensionValues?.map((v) => v.id)).not.toContain(
      'name:quarterly',
    );
  });

  it('multiple selected values are not propagated to a dataset without matching values', () => {
    const multiSelectedFilter: Filter = {
      id: COMMON_FREQUENCY_FILTER_ID,
      filterType: 'shared',
      sourceDatasetUrns: [DATASET_A_URN, DATASET_B_URN],
      dimensionValues: [
        {
          id: 'name:quarterly',
          name: 'Quarterly',
          isSelectedValue: true,
          sourceValues: [
            { datasetUrn: DATASET_A_URN, id: 'Q', name: 'Quarterly' },
          ],
        },
        {
          id: 'name:monthly',
          name: 'Monthly',
          isSelectedValue: true,
          sourceValues: [
            { datasetUrn: DATASET_A_URN, id: 'M', name: 'Monthly' },
          ],
        },
        {
          id: 'name:annual',
          name: 'Annual',
          isSelectedValue: false,
          sourceValues: [
            { datasetUrn: DATASET_A_URN, id: 'A', name: 'Annual' },
            { datasetUrn: DATASET_B_URN, id: 'ANNUAL', name: 'Annual' },
          ],
        },
      ],
    };

    const filtersMap = buildFiltersMap([multiSelectedFilter], undefined, true);
    const dsBFilter = filtersMap
      .get(DATASET_B_URN)
      ?.find((f) => f.id === COMMON_FREQUENCY_FILTER_ID);

    expect(dsBFilter?.dimensionValues).toEqual([
      {
        id: 'ANNUAL',
        name: 'Annual',
        parent: undefined,
        isSelectedValue: false,
      },
    ]);
  });

  it('does not apply fallback when Dataset B already has a natively selected value', () => {
    const bothSelectedFilter: Filter = {
      id: COMMON_FREQUENCY_FILTER_ID,
      filterType: 'shared',
      sourceDatasetUrns: [DATASET_A_URN, DATASET_B_URN],
      dimensionValues: [
        {
          id: 'name:annual',
          name: 'Annual',
          isSelectedValue: true,
          sourceValues: [
            { datasetUrn: DATASET_A_URN, id: 'A', name: 'Annual' },
            { datasetUrn: DATASET_B_URN, id: 'ANNUAL', name: 'Annual' },
          ],
        },
      ],
    };

    const filtersMap = buildFiltersMap([bothSelectedFilter], undefined, true);
    const dsBFilter = filtersMap
      .get(DATASET_B_URN)
      ?.find((f) => f.id === COMMON_FREQUENCY_FILTER_ID);

    expect(
      dsBFilter?.dimensionValues?.find((v) => v.id === 'ANNUAL')
        ?.isSelectedValue,
    ).toBe(true);
    expect(dsBFilter?.dimensionValues?.map((v) => v.id)).not.toContain(
      'name:annual',
    );
  });
});

describe('getCompatibleDatasetUrns', () => {
  it('returns only datasets that support selected shared values', () => {
    const sharedFrequencyFilter: Filter = {
      id: COMMON_FREQUENCY_FILTER_ID,
      filterType: 'shared',
      sourceDatasetUrns: [DATASET_A_URN, DATASET_B_URN],
      dimensionValues: [
        {
          id: 'name:daily',
          name: 'Daily',
          isSelectedValue: true,
          sourceValues: [{ datasetUrn: DATASET_A_URN, id: 'D', name: 'Daily' }],
        },
        {
          id: 'name:monthly',
          name: 'Monthly',
          isSelectedValue: false,
          sourceValues: [
            { datasetUrn: DATASET_A_URN, id: 'M', name: 'Monthly' },
            { datasetUrn: DATASET_B_URN, id: 'M', name: 'Monthly' },
          ],
        },
      ],
    };

    const compatibleUrns = getCompatibleDatasetUrns(
      [sharedFrequencyFilter],
      [DATASET_A_URN, DATASET_B_URN],
    );

    expect(Array.from(compatibleUrns)).toEqual([DATASET_A_URN]);
  });

  it('keeps all datasets when selected value is supported by all', () => {
    const sharedFrequencyFilter: Filter = {
      id: COMMON_FREQUENCY_FILTER_ID,
      filterType: 'shared',
      sourceDatasetUrns: [DATASET_A_URN, DATASET_B_URN],
      dimensionValues: [
        {
          id: 'name:monthly',
          name: 'Monthly',
          isSelectedValue: true,
          sourceValues: [
            { datasetUrn: DATASET_A_URN, id: 'M', name: 'Monthly' },
            { datasetUrn: DATASET_B_URN, id: 'M', name: 'Monthly' },
          ],
        },
      ],
    };

    const compatibleUrns = getCompatibleDatasetUrns(
      [sharedFrequencyFilter],
      [DATASET_A_URN, DATASET_B_URN],
    );

    expect(Array.from(compatibleUrns)).toEqual([DATASET_A_URN, DATASET_B_URN]);
  });

  it('keeps a dataset with an implicit wildcard for the selected shared filter', () => {
    const sharedFrequencyFilter: Filter = {
      id: COMMON_FREQUENCY_FILTER_ID,
      filterType: 'shared',
      sourceDatasetUrns: [DATASET_A_URN, DATASET_B_URN],
      dimensionValues: [
        {
          id: 'name:daily',
          name: 'Daily',
          isSelectedValue: true,
          sourceValues: [{ datasetUrn: DATASET_A_URN, id: 'D', name: 'Daily' }],
        },
        {
          id: 'name:annual',
          name: 'Annual',
          isSelectedValue: false,
          sourceValues: [
            { datasetUrn: DATASET_B_URN, id: 'A', name: 'Annual' },
          ],
        },
      ],
    };

    const compatibleUrns = getCompatibleDatasetUrns(
      [sharedFrequencyFilter],
      [DATASET_A_URN, DATASET_B_URN],
      [
        {
          urn: DATASET_A_URN,
          filters: [
            {
              componentCode: 'FREQ',
              operator: QueryFilterType.IN,
              values: ['D'],
            },
          ],
        },
        {
          urn: DATASET_B_URN,
          filters: [],
        },
      ] as DataQuery[],
      DATASET_DIMENSIONS_METADATA_MAP,
    );

    expect(Array.from(compatibleUrns)).toEqual([DATASET_A_URN, DATASET_B_URN]);
  });

  it('excludes a dataset whose filter entry is present in appliedFiltersMap but has no selected values', () => {
    const sharedCountryFilter: Filter = {
      id: COMMON_COUNTRY_FILTER_ID,
      filterType: 'shared',
      sourceDatasetUrns: [DATASET_A_URN, DATASET_B_URN],
      sourceFilterIdsByDataset: {
        [DATASET_A_URN]: 'REF_AREA',
        [DATASET_B_URN]: 'COUNTRY',
      },
      dimensionValues: [
        {
          id: 'name:united-states',
          name: 'United States',
          isSelectedValue: true,
          sourceValues: [
            { datasetUrn: DATASET_A_URN, id: 'US', name: 'United States' },
          ],
        },
        {
          id: 'name:canada',
          name: 'Canada',
          isSelectedValue: false,
          sourceValues: [
            { datasetUrn: DATASET_B_URN, id: 'CA', name: 'Canada' },
          ],
        },
      ],
    };
    const appliedFiltersMap = new Map<string, Filter[]>([
      [
        DATASET_A_URN,
        [
          {
            id: 'REF_AREA',
            datasetUrn: DATASET_A_URN,
            filterType: 'dataset',
            dimensionValues: [{ id: 'US', isSelectedValue: true }],
          } as Filter,
        ],
      ],
      [
        DATASET_B_URN,
        [
          {
            id: 'COUNTRY',
            datasetUrn: DATASET_B_URN,
            filterType: 'dataset',
            isExcluded: true,
            dimensionValues: [{ id: 'CA', isSelectedValue: false }],
          } as Filter,
        ],
      ],
    ]);

    const compatibleUrns = getCompatibleDatasetUrns(
      [sharedCountryFilter],
      [DATASET_A_URN, DATASET_B_URN],
      undefined,
      DATASET_DIMENSIONS_METADATA_MAP,
      appliedFiltersMap,
    );

    expect(Array.from(compatibleUrns)).toEqual([DATASET_A_URN]);
  });

  it('uses applied filters to keep a dataset that becomes an implicit wildcard after modal changes', () => {
    const sharedCountryFilter: Filter = {
      id: COMMON_COUNTRY_FILTER_ID,
      filterType: 'shared',
      sourceDatasetUrns: [DATASET_A_URN, DATASET_B_URN],
      sourceFilterIdsByDataset: {
        [DATASET_A_URN]: 'REF_AREA',
        [DATASET_B_URN]: 'COUNTRY',
      },
      dimensionValues: [
        {
          id: 'name:united-states',
          name: 'United States',
          isSelectedValue: true,
          sourceValues: [
            { datasetUrn: DATASET_A_URN, id: 'US', name: 'United States' },
          ],
        },
        {
          id: 'name:canada',
          name: 'Canada',
          isSelectedValue: false,
          sourceValues: [
            { datasetUrn: DATASET_B_URN, id: 'CA', name: 'Canada' },
          ],
        },
      ],
    };
    const staleDataQueries = [
      {
        urn: DATASET_A_URN,
        filters: [
          {
            componentCode: 'REF_AREA',
            operator: QueryFilterType.IN,
            values: ['US'],
          },
        ],
      },
      {
        urn: DATASET_B_URN,
        filters: [
          {
            componentCode: 'COUNTRY',
            operator: QueryFilterType.IN,
            values: ['CA'],
          },
        ],
      },
    ] as DataQuery[];
    const appliedFiltersMap = new Map<string, Filter[]>([
      [
        DATASET_A_URN,
        [
          {
            id: 'REF_AREA',
            datasetUrn: DATASET_A_URN,
            filterType: 'dataset',
            dimensionValues: [
              {
                id: 'US',
                name: 'United States',
                isSelectedValue: true,
              },
            ],
          } as Filter,
        ],
      ],
      [DATASET_B_URN, []],
    ]);

    const compatibleUrns = getCompatibleDatasetUrns(
      [sharedCountryFilter],
      [DATASET_A_URN, DATASET_B_URN],
      staleDataQueries,
      DATASET_DIMENSIONS_METADATA_MAP,
      appliedFiltersMap,
    );

    expect(Array.from(compatibleUrns)).toEqual([DATASET_A_URN, DATASET_B_URN]);
  });
});

describe('getConstraintsRequests', () => {
  it('includes shared non-time dimension filters in constraint requests for each dataset', async () => {
    const sharedFrequencyFilter = {
      id: COMMON_FREQUENCY_FILTER_ID,
      filterType: 'shared',
      sourceDatasetUrns: [DATASET_A_URN, DATASET_B_URN],
      sourceFilterIdsByDataset: {
        [DATASET_A_URN]: 'FREQ',
        [DATASET_B_URN]: COMMON_FREQUENCY_FILTER_ID,
      },
      dimensionValues: [
        {
          id: 'name:daily',
          name: 'Daily',
          isSelectedValue: true,
          sourceValues: [{ datasetUrn: DATASET_A_URN, id: 'D', name: 'Daily' }],
        },
      ],
    } as Filter;
    const sourceFilters = [sharedFrequencyFilter];
    const actions = {
      getConstraints: jest.fn(() =>
        Promise.resolve({ data: { dataConstraints: [] } } as any),
      ),
    };

    await Promise.all(
      getConstraintsRequests(
        [{ urn: DATASET_A_URN }, { urn: DATASET_B_URN }] as any[],
        new Map(),
        actions,
        DATASET_DIMENSIONS_METADATA_MAP,
        sourceFilters,
      ),
    );

    expect(mockGetSeriesFilterDto).toHaveBeenCalledWith(
      sourceFilters,
      DATASET_A_URN,
      DATASET_DIMENSIONS_METADATA_MAP,
    );
    expect(mockGetSeriesFilterDto).toHaveBeenCalledWith(
      sourceFilters,
      DATASET_B_URN,
      DATASET_DIMENSIONS_METADATA_MAP,
    );
  });
});

describe('hasImplicitSharedWildcard', () => {
  const buildStructureDataMaps = (dimensionsMap: Map<string, any[]>): any => ({
    dimensionsMap,
    structuresMap: new Map(),
    dataMessagesMap: new Map(),
    datasetsMap: new Map(),
    structureDimensionsMap: new Map(),
    constraintsMap: new Map(),
  });

  it('returns false for a single dataset (nothing to merge)', () => {
    const structureDataMaps = buildStructureDataMaps(
      new Map([[DATASET_A_URN, [{ id: 'FREQ' }]]]),
    );
    expect(
      hasImplicitSharedWildcard(
        [
          {
            urn: DATASET_A_URN,
            filters: [{ componentCode: 'FREQ', operator: 'IN', values: ['D'] }],
          },
        ] as any,
        structureDataMaps,
        DATASET_DIMENSIONS_METADATA_MAP,
      ),
    ).toBe(false);
  });

  it('returns true when one dataset lacks a shared dimension filter that another dataset has explicit values for', () => {
    const structureDataMaps = buildStructureDataMaps(
      new Map([
        [DATASET_A_URN, [{ id: 'FREQ' }]],
        [DATASET_B_URN, [{ id: 'FREQUENCY' }]],
      ]),
    );
    const dataQueries = [
      {
        urn: DATASET_A_URN,
        filters: [{ componentCode: 'FREQ', operator: 'IN', values: ['D'] }],
      },
      {
        urn: DATASET_B_URN,
        filters: [],
      },
    ] as any;
    expect(
      hasImplicitSharedWildcard(
        dataQueries,
        structureDataMaps,
        DATASET_DIMENSIONS_METADATA_MAP,
      ),
    ).toBe(true);
  });

  it('returns false when both datasets have explicit filters for the shared dimension', () => {
    const structureDataMaps = buildStructureDataMaps(
      new Map([
        [DATASET_A_URN, [{ id: 'FREQ' }]],
        [DATASET_B_URN, [{ id: 'FREQUENCY' }]],
      ]),
    );
    const dataQueries = [
      {
        urn: DATASET_A_URN,
        filters: [{ componentCode: 'FREQ', operator: 'IN', values: ['D'] }],
      },
      {
        urn: DATASET_B_URN,
        filters: [
          { componentCode: 'FREQUENCY', operator: 'IN', values: ['M'] },
        ],
      },
    ] as any;
    expect(
      hasImplicitSharedWildcard(
        dataQueries,
        structureDataMaps,
        DATASET_DIMENSIONS_METADATA_MAP,
      ),
    ).toBe(false);
  });

  it('returns false when neither dataset has explicit values (both implicit wildcards)', () => {
    const structureDataMaps = buildStructureDataMaps(
      new Map([
        [DATASET_A_URN, [{ id: 'FREQ' }]],
        [DATASET_B_URN, [{ id: 'FREQUENCY' }]],
      ]),
    );
    const dataQueries = [
      { urn: DATASET_A_URN, filters: [] },
      { urn: DATASET_B_URN, filters: [] },
    ] as any;
    expect(
      hasImplicitSharedWildcard(
        dataQueries,
        structureDataMaps,
        DATASET_DIMENSIONS_METADATA_MAP,
      ),
    ).toBe(false);
  });

  it('returns false when one dataset has an EXCLUDED filter for the shared dimension', () => {
    const structureDataMaps = buildStructureDataMaps(
      new Map([
        [DATASET_A_URN, [{ id: 'FREQ' }]],
        [DATASET_B_URN, [{ id: 'FREQUENCY' }]],
      ]),
    );
    const dataQueries = [
      {
        urn: DATASET_A_URN,
        filters: [
          {
            componentCode: 'FREQ',
            operator: QueryFilterType.IN,
            values: ['D'],
          },
        ],
      },
      {
        urn: DATASET_B_URN,
        filters: [
          {
            componentCode: 'FREQUENCY',
            operator: QueryFilterType.EXCLUDED,
            values: [],
          },
        ],
      },
    ] as any;

    expect(
      hasImplicitSharedWildcard(
        dataQueries,
        structureDataMaps,
        DATASET_DIMENSIONS_METADATA_MAP,
      ),
    ).toBe(false);
  });

  it('ignores time dimensions', () => {
    const structureDataMaps = buildStructureDataMaps(
      new Map([
        [DATASET_A_URN, [{ id: 'TIME_PERIOD' }]],
        [DATASET_B_URN, [{ id: 'TIME_PERIOD' }]],
      ]),
    );
    const dataQueries = [
      {
        urn: DATASET_A_URN,
        filters: [
          {
            componentCode: 'TIME_PERIOD',
            operator: 'BETWEEN',
            values: ['2020', '2024'],
          },
        ],
      },
      { urn: DATASET_B_URN, filters: [] },
    ] as any;
    expect(
      hasImplicitSharedWildcard(
        dataQueries,
        structureDataMaps,
        DATASET_DIMENSIONS_METADATA_MAP,
      ),
    ).toBe(false);
  });
});

describe('getImplicitSharedWildcardFilterParams', () => {
  const buildStructureDataMaps = (dimensionsMap: Map<string, any[]>): any => ({
    dimensionsMap,
    structuresMap: new Map([
      [DATASET_A_URN, {}],
      [DATASET_B_URN, {}],
    ]),
    dataMessagesMap: new Map(),
    datasetsMap: new Map(),
    structureDimensionsMap: new Map(),
    constraintsMap: new Map(),
  });

  beforeEach(() => {
    mockGetDatasetFilters.mockImplementation(
      (_dimensions, _structures, _structureDimensions, _locale, datasetUrn) =>
        datasetUrn === DATASET_A_URN
          ? [
              {
                id: 'FREQ',
                filterType: 'dataset',
                datasetUrn: DATASET_A_URN,
                dimensionValues: [],
              } as Filter,
            ]
          : [
              {
                id: COMMON_FREQUENCY_FILTER_ID,
                filterType: 'dataset',
                datasetUrn: DATASET_B_URN,
                dimensionValues: [],
              } as Filter,
            ],
    );
    mockGetAvailableCodesFromConstrains.mockImplementation(
      (_codes, dimensionId) =>
        dimensionId === 'FREQ'
          ? [
              { id: 'D', name: 'Daily', isSelectedValue: false },
              { id: 'M', name: 'Monthly', isSelectedValue: false },
            ]
          : [{ id: 'M', name: 'Monthly', isSelectedValue: false }],
    );
    mockGetFiltersPreselectedByDataQuery.mockImplementation(
      (filters: Filter[], dataQuery: DataQuery) =>
        filters.map((filter) => ({
          ...filter,
          dimensionValues: filter.dimensionValues?.map((value) => ({
            ...value,
            isSelectedValue: dataQuery.filters?.some(
              (queryFilter) =>
                queryFilter.componentCode === filter.id &&
                queryFilter.values?.includes(value.id),
            ),
          })),
        })),
    );
    mockGetQueryFilters.mockReturnValue({
      filterKey: 'EXPANDED',
      timeFilter: null,
    });
  });

  it('builds expanded filter params for datasets made compatible by an implicit shared wildcard', () => {
    const dataQueries = [
      {
        urn: DATASET_A_URN,
        filters: [
          {
            componentCode: 'FREQ',
            operator: QueryFilterType.IN,
            values: ['D'],
          },
        ],
      },
      { urn: DATASET_B_URN, filters: [] },
    ] as DataQuery[];
    const structureDataMaps = buildStructureDataMaps(
      new Map([
        [DATASET_A_URN, [{ id: 'FREQ' }]],
        [DATASET_B_URN, [{ id: COMMON_FREQUENCY_FILTER_ID }]],
      ]),
    );

    const result = getImplicitSharedWildcardFilterParams(
      dataQueries,
      structureDataMaps,
      new Map([
        [DATASET_A_URN, []],
        [DATASET_B_URN, []],
      ]),
      'en',
      DATASET_DIMENSIONS_METADATA_MAP,
    );

    expect(Array.from(result?.compatibleUrns ?? [])).toEqual([
      DATASET_A_URN,
      DATASET_B_URN,
    ]);
    expect(result?.filterParamsMap).toEqual(
      new Map([
        [DATASET_A_URN, { filterKey: 'EXPANDED', timeFilter: null }],
        [DATASET_B_URN, { filterKey: 'EXPANDED', timeFilter: null }],
      ]),
    );
  });

  it('returns undefined when there is no implicit shared wildcard to expand', () => {
    const result = getImplicitSharedWildcardFilterParams(
      [
        {
          urn: DATASET_A_URN,
          filters: [
            {
              componentCode: 'FREQ',
              operator: QueryFilterType.IN,
              values: ['D'],
            },
          ],
        },
      ] as DataQuery[],
      buildStructureDataMaps(new Map([[DATASET_A_URN, [{ id: 'FREQ' }]]])),
      new Map([[DATASET_A_URN, []]]),
      'en',
      DATASET_DIMENSIONS_METADATA_MAP,
    );

    expect(result).toBeUndefined();
  });
});

describe('getRestoredActiveDatasetUrns', () => {
  it('restores only datasets that have the persisted shared filter selection', () => {
    const dataQueries = [
      {
        urn: DATASET_A_URN,
        filters: [],
      },
      {
        urn: DATASET_B_URN,
        filters: [
          {
            componentCode: 'FREQUENCY',
            operator: QueryFilterType.IN,
            values: ['Q'],
          },
        ],
      },
    ] as DataQuery[];

    expect(
      getRestoredActiveDatasetUrns(
        dataQueries,
        DATASET_DIMENSIONS_METADATA_MAP,
      ),
    ).toEqual([DATASET_B_URN]);
  });

  it('ignores time filters when restoring active datasets', () => {
    const dataQueries = [
      {
        urn: DATASET_A_URN,
        filters: [
          {
            componentCode: COMMON_TIME_PERIOD_FILTER_ID,
            operator: QueryFilterType.BETWEEN,
            values: ['2024-01-01', '2024-12-31'],
          },
        ],
      },
      {
        urn: DATASET_B_URN,
        filters: [
          {
            componentCode: COMMON_TIME_PERIOD_FILTER_ID,
            operator: QueryFilterType.BETWEEN,
            values: ['2024-01-01', '2024-12-31'],
          },
        ],
      },
    ] as DataQuery[];

    expect(
      getRestoredActiveDatasetUrns(
        dataQueries,
        DATASET_DIMENSIONS_METADATA_MAP,
      ),
    ).toBeUndefined();
  });

  it('does not restore a dataset whose shared dimension filter is EXCLUDED', () => {
    const dataQueries = [
      {
        urn: DATASET_A_URN,
        filters: [
          {
            componentCode: 'FREQ',
            operator: QueryFilterType.IN,
            values: ['D'],
          },
        ],
      },
      {
        urn: DATASET_B_URN,
        filters: [
          {
            componentCode: 'FREQUENCY',
            operator: QueryFilterType.EXCLUDED,
            values: [],
          },
        ],
      },
    ] as DataQuery[];

    expect(
      getRestoredActiveDatasetUrns(
        dataQueries,
        DATASET_DIMENSIONS_METADATA_MAP,
      ),
    ).toEqual([DATASET_A_URN]);
  });
});

describe('getDataQueriesWithExpandedSharedDimensionFilters', () => {
  const constraintsWithValues = (componentId: string, values: string[]) =>
    [
      {
        cubeRegions: [
          {
            isIncluded: true,
            memberSelection: [
              {
                componentId,
                selectionValues: values.map((memberValue) => ({
                  memberValue,
                })),
              },
            ],
          },
        ],
      },
    ] as any;

  it('expands an explicit frequency filter with values available to an implicit sibling dataset', () => {
    const dataQueries = [
      {
        urn: DATASET_A_URN,
        filters: [
          {
            componentCode: 'FREQ',
            operator: QueryFilterType.IN,
            values: ['D'],
          },
          {
            componentCode: 'EER_TYPE',
            operator: QueryFilterType.IN,
            values: ['N'],
          },
        ],
      },
      {
        urn: DATASET_B_URN,
        filters: [],
      },
    ] as DataQuery[];

    const result = getDataQueriesWithExpandedSharedDimensionFilters(
      dataQueries,
      new Map([
        [DATASET_A_URN, constraintsWithValues('FREQ', ['D', 'M', 'A'])],
        [
          DATASET_B_URN,
          constraintsWithValues(COMMON_FREQUENCY_FILTER_ID, ['D', 'M']),
        ],
      ]),
      DATASET_DIMENSIONS_METADATA_MAP,
    );

    expect(result[0].filters).toEqual([
      {
        componentCode: 'FREQ',
        operator: QueryFilterType.IN,
        values: ['D', 'M'],
      },
      {
        componentCode: 'EER_TYPE',
        operator: QueryFilterType.IN,
        values: ['N'],
      },
    ]);
    expect(result[1]).toBe(dataQueries[1]);
  });

  it('expands an explicit region filter with values available to an implicit sibling dataset', () => {
    const dataQueries = [
      {
        urn: DATASET_A_URN,
        filters: [
          {
            componentCode: 'REF_AREA',
            operator: QueryFilterType.IN,
            values: ['US'],
          },
        ],
      },
      {
        urn: DATASET_B_URN,
        filters: [],
      },
    ] as DataQuery[];

    const result = getDataQueriesWithExpandedSharedDimensionFilters(
      dataQueries,
      new Map([
        [DATASET_A_URN, constraintsWithValues('REF_AREA', ['US', 'CA', 'MX'])],
        [DATASET_B_URN, constraintsWithValues('COUNTRY', ['US', 'CA'])],
      ]),
      DATASET_DIMENSIONS_METADATA_MAP,
    );

    expect(result[0].filters).toEqual([
      {
        componentCode: 'REF_AREA',
        operator: QueryFilterType.IN,
        values: ['US', 'CA'],
      },
    ]);
    expect(result[1]).toBe(dataQueries[1]);
  });

  it('does not expand shared dimension filters when there is no implicit sibling dataset', () => {
    const dataQueries = [
      {
        urn: DATASET_A_URN,
        filters: [
          {
            componentCode: 'FREQ',
            operator: QueryFilterType.IN,
            values: ['D'],
          },
        ],
      },
    ] as DataQuery[];

    expect(
      getDataQueriesWithExpandedSharedDimensionFilters(
        dataQueries,
        new Map([[DATASET_A_URN, constraintsWithValues('FREQ', ['D', 'M'])]]),
        DATASET_DIMENSIONS_METADATA_MAP,
      ),
    ).toBe(dataQueries);
  });
});

// ─── Shared factory helpers ───────────────────────────────────────────────────

const makeSharedFilter = (
  overrides: Partial<SharedFilter> = {},
): SharedFilter => ({
  id: COMMON_COUNTRY_FILTER_ID,
  filterType: 'shared',
  dimensionValues: [],
  sourceDatasetUrns: [],
  ...overrides,
});

const makeFilterValue = (
  id: string,
  sourceUrns: string[],
  isSelectedValue = false,
): FilterValue => ({
  id,
  name: id,
  isSelectedValue,
  sourceValues: sourceUrns.map((urn) => ({ datasetUrn: urn, id, name: id })),
});

const makeDatasetFilter = (datasetUrn: string): DatasetFilter => ({
  id: 'INDICATOR',
  filterType: 'dataset',
  datasetUrn,
});

// Used by the Time Period tests added in Task 2 and the buildFiltersMap tests in Task 3.
const makeTimeFilter = (
  sourceDatasetUrns: string[],
  timeRange?: { startPeriod: Date; endPeriod: Date },
): SharedFilter => ({
  id: COMMON_TIME_PERIOD_FILTER_ID,
  filterType: 'shared',
  isTimeDimension: true,
  sourceDatasetUrns,
  timeRange,
});

// ─── filterSharedValuesForEnabledDatasets ────────────────────────────────────

describe('filterSharedValuesForEnabledDatasets', () => {
  describe('Country / Frequency (discrete values)', () => {
    it('returns filters unchanged when disabledDatasetUrns is empty', () => {
      const value = makeFilterValue('france', ['urn-A']);
      const filter = makeSharedFilter({ dimensionValues: [value] });
      expect(filterSharedValuesForEnabledDatasets([filter], new Set())).toEqual(
        [filter],
      );
    });

    it('passes DatasetFilter entries through unchanged', () => {
      const df = makeDatasetFilter('urn-A');
      expect(
        filterSharedValuesForEnabledDatasets([df], new Set(['urn-A'])),
      ).toEqual([df]);
    });

    it('keeps values that have at least one enabled source dataset', () => {
      const france = makeFilterValue('france', ['urn-A', 'urn-B']); // A enabled, B disabled
      const germany = makeFilterValue('germany', ['urn-A']); // A enabled
      const filter = makeSharedFilter({ dimensionValues: [france, germany] });

      const result = filterSharedValuesForEnabledDatasets(
        [filter],
        new Set(['urn-B']),
      );

      const resultFilter = result[0] as SharedFilter;
      expect(resultFilter.dimensionValues).toHaveLength(2);
      expect(resultFilter.dimensionValues?.map((v) => v.id)).toEqual([
        'france',
        'germany',
      ]);
    });

    it('hides values whose every source dataset is disabled', () => {
      const france = makeFilterValue('france', ['urn-A']); // A enabled
      const daily = makeFilterValue('daily', ['urn-B']); // B disabled
      const filter = makeSharedFilter({
        id: COMMON_FREQUENCY_FILTER_ID,
        dimensionValues: [france, daily],
      });

      const result = filterSharedValuesForEnabledDatasets(
        [filter],
        new Set(['urn-B']),
      );

      const resultFilter = result[0] as SharedFilter;
      expect(resultFilter.dimensionValues).toHaveLength(1);
      expect(resultFilter.dimensionValues?.[0].id).toBe('france');
    });

    it('hides the entire SharedFilter facet when all values come from disabled datasets', () => {
      const daily = makeFilterValue('daily', ['urn-A']); // A disabled
      const filter = makeSharedFilter({ dimensionValues: [daily] });

      const result = filterSharedValuesForEnabledDatasets(
        [filter],
        new Set(['urn-A']),
      );

      expect(result).toHaveLength(0);
    });

    it('preserves isSelectedValue on visible values', () => {
      const selected = makeFilterValue('france', ['urn-A'], true); // selected, A enabled
      const filter = makeSharedFilter({ dimensionValues: [selected] });

      const result = filterSharedValuesForEnabledDatasets(
        [filter],
        new Set(['urn-B']),
      );

      expect(
        (result[0] as SharedFilter).dimensionValues?.[0].isSelectedValue,
      ).toBe(true);
    });

    it('does not mutate the original filter', () => {
      const daily = makeFilterValue('daily', ['urn-B']);
      const france = makeFilterValue('france', ['urn-A']);
      const filter = makeSharedFilter({ dimensionValues: [france, daily] });
      const originalLength = filter.dimensionValues?.length;

      filterSharedValuesForEnabledDatasets([filter], new Set(['urn-B']));

      expect(filter.dimensionValues).toHaveLength(originalLength!);
    });
  });

  describe('Time Period (continuous range)', () => {
    it('hides the Time Period facet when all source datasets are disabled', () => {
      const filter = makeTimeFilter(['urn-A', 'urn-B']);

      const result = filterSharedValuesForEnabledDatasets(
        [filter],
        new Set(['urn-A', 'urn-B']),
      );

      expect(result).toHaveLength(0);
    });

    it('keeps the Time Period facet when at least one source dataset is enabled', () => {
      const filter = makeTimeFilter(['urn-A', 'urn-B']);

      const result = filterSharedValuesForEnabledDatasets(
        [filter],
        new Set(['urn-B']), // only B disabled; A enabled
      );

      expect(result).toHaveLength(1);
    });

    it('filters sourceDatasetUrns to only enabled datasets', () => {
      const filter = makeTimeFilter(['urn-A', 'urn-B', 'urn-C']);

      const result = filterSharedValuesForEnabledDatasets(
        [filter],
        new Set(['urn-B']),
      );

      expect((result[0] as SharedFilter).sourceDatasetUrns).toEqual([
        'urn-A',
        'urn-C',
      ]);
    });

    it('clips the user timeRange to the union of enabled datasets available bounds', () => {
      // A covers 2010–2020. B is disabled (covered 2018–2030).
      // User selected 2015–2025. After disabling B: clip to 2015–2020.
      const filter = makeTimeFilter(['urn-A', 'urn-B'], {
        startPeriod: new Date('2015-01-01'),
        endPeriod: new Date('2025-01-01'),
      });

      const constraintsMap = new Map([
        ['urn-A', [{}] as any], // content doesn't matter — getAnnotationPeriod is mocked
      ]);

      mockGetAnnotationPeriod.mockReturnValueOnce({
        startPeriod: new Date('2010-01-01'),
        endPeriod: new Date('2020-12-31'),
      });

      const result = filterSharedValuesForEnabledDatasets(
        [filter],
        new Set(['urn-B']),
        constraintsMap,
      );

      const resultFilter = result[0] as SharedFilter;
      // start: max(2015, 2010) = 2015
      expect(resultFilter.timeRange?.startPeriod).toEqual(
        new Date('2015-01-01'),
      );
      // end: min(2025, 2020) = 2020
      expect(resultFilter.timeRange?.endPeriod).toEqual(new Date('2020-12-31'));
    });

    it('does not expand endPeriod beyond user selection when union range is wider', () => {
      // A: 2010–2022, C: 2018–2024. User selected 2015–2020. Union end = 2024 (wider than user).
      // Clip: start max(2015, 2010) = 2015; end min(2020, 2024) = 2020 (user end preserved).
      const filter = makeTimeFilter(['urn-A', 'urn-B', 'urn-C'], {
        startPeriod: new Date('2015-01-01'),
        endPeriod: new Date('2020-01-01'),
      });

      const constraintsMap = new Map([
        ['urn-A', [{}] as any],
        ['urn-C', [{}] as any],
      ]);

      mockGetAnnotationPeriod
        .mockReturnValueOnce({
          startPeriod: new Date('2010-01-01'),
          endPeriod: new Date('2022-12-31'),
        })
        .mockReturnValueOnce({
          startPeriod: new Date('2018-01-01'),
          endPeriod: new Date('2024-12-31'),
        });

      const result = filterSharedValuesForEnabledDatasets(
        [filter],
        new Set(['urn-B']),
        constraintsMap,
      );

      const resultFilter = result[0] as SharedFilter;
      expect(resultFilter.timeRange?.startPeriod).toEqual(
        new Date('2015-01-01'),
      );
      expect(resultFilter.timeRange?.endPeriod).toEqual(new Date('2020-01-01'));
    });

    it('clamps to availableEnd when selection is entirely after the available range', () => {
      // A covers 2000–2020. User selected 2022–2024 (entirely after A's range).
      // Expected: clamp to {2020, 2020} — same logic as limitTimeRangeByConstraints.
      const filter = makeTimeFilter(['urn-A', 'urn-B'], {
        startPeriod: new Date('2022-01-01'),
        endPeriod: new Date('2024-01-01'),
      });

      const constraintsMap = new Map([['urn-A', [{}] as any]]);

      mockGetAnnotationPeriod.mockReturnValueOnce({
        startPeriod: new Date('2000-01-01'),
        endPeriod: new Date('2020-12-31'),
      });

      const result = filterSharedValuesForEnabledDatasets(
        [filter],
        new Set(['urn-B']),
        constraintsMap,
      );

      const resultFilter = result[0] as SharedFilter;
      expect(resultFilter.timeRange?.startPeriod).toEqual(
        new Date('2020-12-31'),
      );
      expect(resultFilter.timeRange?.endPeriod).toEqual(new Date('2020-12-31'));
    });

    it('clamps to availableStart when selection is entirely before the available range', () => {
      // A covers 2010–2020. User selected 2000–2008 (entirely before A's range).
      // Expected: clamp to {2010, 2010}.
      const filter = makeTimeFilter(['urn-A', 'urn-B'], {
        startPeriod: new Date('2000-01-01'),
        endPeriod: new Date('2008-12-31'),
      });

      const constraintsMap = new Map([['urn-A', [{}] as any]]);

      mockGetAnnotationPeriod.mockReturnValueOnce({
        startPeriod: new Date('2010-01-01'),
        endPeriod: new Date('2020-12-31'),
      });

      const result = filterSharedValuesForEnabledDatasets(
        [filter],
        new Set(['urn-B']),
        constraintsMap,
      );

      const resultFilter = result[0] as SharedFilter;
      expect(resultFilter.timeRange?.startPeriod).toEqual(
        new Date('2010-01-01'),
      );
      expect(resultFilter.timeRange?.endPeriod).toEqual(new Date('2010-01-01'));
    });

    it('does not clip timeRange when no constraintsMap provided', () => {
      const originalRange = {
        startPeriod: new Date('2015-01-01'),
        endPeriod: new Date('2025-01-01'),
      };
      const filter = makeTimeFilter(['urn-A', 'urn-B'], originalRange);

      const result = filterSharedValuesForEnabledDatasets(
        [filter],
        new Set(['urn-B']),
        undefined,
      );

      expect((result[0] as SharedFilter).timeRange).toEqual(originalRange);
    });
  });

  describe('buildFiltersMap — disabledDatasetUrns', () => {
    it('includes all datasets when disabledDatasetUrns is empty', () => {
      const filter = makeSharedFilter({
        sourceDatasetUrns: ['urn-A', 'urn-B'],
        dimensionValues: [makeFilterValue('france', ['urn-A', 'urn-B'], true)],
      });

      const result = buildFiltersMap(
        [filter],
        undefined,
        false,
        undefined,
        new Set(),
      );

      expect(result.has('urn-A')).toBe(true);
      expect(result.has('urn-B')).toBe(true);
    });

    it('omits disabled datasets for Country/Frequency SharedFilters', () => {
      const filter = makeSharedFilter({
        sourceDatasetUrns: ['urn-A', 'urn-B'],
        dimensionValues: [makeFilterValue('france', ['urn-A', 'urn-B'], true)],
      });

      const result = buildFiltersMap(
        [filter],
        undefined,
        false,
        undefined,
        new Set(['urn-B']),
      );

      expect(result.has('urn-A')).toBe(true);
      expect(result.has('urn-B')).toBe(false);
    });

    it('omits disabled datasets for Time Period SharedFilters', () => {
      const filter = makeTimeFilter(['urn-A', 'urn-B'], {
        startPeriod: new Date('2020-01-01'),
        endPeriod: new Date('2025-12-31'),
      });

      const result = buildFiltersMap(
        [filter],
        undefined,
        false,
        undefined,
        new Set(['urn-B']),
      );

      expect(result.has('urn-A')).toBe(true);
      expect(result.has('urn-B')).toBe(false);
    });

    it('omits disabled datasets that appear via DatasetFilter entries', () => {
      // DatasetFilter for a disabled dataset must also be removed so
      // onMultipleDataFiltersChange does not overwrite that dataset's saved filters
      const df: DatasetFilter = {
        id: 'INDICATOR',
        filterType: 'dataset',
        datasetUrn: 'urn-B',
      };

      const result = buildFiltersMap(
        [df],
        undefined,
        false,
        undefined,
        new Set(['urn-B']),
      );

      expect(result.has('urn-B')).toBe(false);
    });
  });
});

// ─── buildFiltersMap — limitTimeRangeByConstraints ───────────────────────────

describe('buildFiltersMap — limitTimeRangeByConstraints', () => {
  const makeTimeDimensionFilter = (
    urn: string,
    startPeriod: Date,
    endPeriod: Date,
  ): Filter => ({
    id: COMMON_TIME_PERIOD_FILTER_ID,
    filterType: 'dataset',
    datasetUrn: urn,
    isTimeDimension: true,
    timeRange: { startPeriod, endPeriod },
  });

  const makeConstraintsMap = (urn: string) => new Map([[urn, [{}] as any]]);

  it('clips startPeriod up to availableStart when selection starts before the range', () => {
    mockGetAnnotationPeriod.mockReturnValueOnce({
      startPeriod: new Date('2010-01-01'),
      endPeriod: new Date('2020-12-31'),
    });

    const filter = makeTimeDimensionFilter(
      'urn-A',
      new Date('2005-01-01'),
      new Date('2018-01-01'),
    );
    const result = buildFiltersMap([filter], makeConstraintsMap('urn-A'));
    const tf = result.get('urn-A')?.find((f) => f.isTimeDimension);

    expect(tf?.timeRange?.startPeriod).toEqual(new Date('2010-01-01'));
    expect(tf?.timeRange?.endPeriod).toEqual(new Date('2018-01-01'));
  });

  it('clips endPeriod down to availableEnd when selection ends after the range', () => {
    mockGetAnnotationPeriod.mockReturnValueOnce({
      startPeriod: new Date('2010-01-01'),
      endPeriod: new Date('2020-12-31'),
    });

    const filter = makeTimeDimensionFilter(
      'urn-A',
      new Date('2015-01-01'),
      new Date('2025-01-01'),
    );
    const result = buildFiltersMap([filter], makeConstraintsMap('urn-A'));
    const tf = result.get('urn-A')?.find((f) => f.isTimeDimension);

    expect(tf?.timeRange?.startPeriod).toEqual(new Date('2015-01-01'));
    expect(tf?.timeRange?.endPeriod).toEqual(new Date('2020-12-31'));
  });

  it('clamps to {availableEnd, availableEnd} when selection is entirely after the range', () => {
    mockGetAnnotationPeriod.mockReturnValueOnce({
      startPeriod: new Date('2010-01-01'),
      endPeriod: new Date('2020-12-31'),
    });

    const filter = makeTimeDimensionFilter(
      'urn-A',
      new Date('2022-01-01'),
      new Date('2024-01-01'),
    );
    const result = buildFiltersMap([filter], makeConstraintsMap('urn-A'));
    const tf = result.get('urn-A')?.find((f) => f.isTimeDimension);

    expect(tf?.timeRange?.startPeriod).toEqual(new Date('2020-12-31'));
    expect(tf?.timeRange?.endPeriod).toEqual(new Date('2020-12-31'));
  });

  it('clamps to {availableStart, availableStart} when selection is entirely before the range', () => {
    mockGetAnnotationPeriod.mockReturnValueOnce({
      startPeriod: new Date('2010-01-01'),
      endPeriod: new Date('2020-12-31'),
    });

    const filter = makeTimeDimensionFilter(
      'urn-A',
      new Date('2000-01-01'),
      new Date('2008-12-31'),
    );
    const result = buildFiltersMap([filter], makeConstraintsMap('urn-A'));
    const tf = result.get('urn-A')?.find((f) => f.isTimeDimension);

    expect(tf?.timeRange?.startPeriod).toEqual(new Date('2010-01-01'));
    expect(tf?.timeRange?.endPeriod).toEqual(new Date('2010-01-01'));
  });

  it('leaves timeRange unchanged when annotation bounds are absent from constraints', () => {
    // default mock returns { startPeriod: null, endPeriod: null } — no clipping
    const filter = makeTimeDimensionFilter(
      'urn-A',
      new Date('2015-01-01'),
      new Date('2019-01-01'),
    );
    const result = buildFiltersMap([filter], makeConstraintsMap('urn-A'));
    const tf = result.get('urn-A')?.find((f) => f.isTimeDimension);

    expect(tf?.timeRange?.startPeriod).toEqual(new Date('2015-01-01'));
    expect(tf?.timeRange?.endPeriod).toEqual(new Date('2019-01-01'));
  });

  it('leaves timeRange unchanged when no constraintsMap is provided', () => {
    const filter = makeTimeDimensionFilter(
      'urn-A',
      new Date('2015-01-01'),
      new Date('2019-01-01'),
    );
    const result = buildFiltersMap([filter], undefined);
    const tf = result.get('urn-A')?.find((f) => f.isTimeDimension);

    expect(tf?.timeRange?.startPeriod).toEqual(new Date('2015-01-01'));
    expect(tf?.timeRange?.endPeriod).toEqual(new Date('2019-01-01'));
  });
});
