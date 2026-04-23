import {
  COMMON_COUNTRY_FILTER_ID,
  COMMON_FREQUENCY_FILTER_ID,
  buildFiltersMap,
  getConstraintsMap,
  getConstraintsMapFromSettledResults,
  getDatasetNameFromFilters,
  getFilledDatasetFiltersMap,
  getFiltersByConstraints,
  getFiltersForQueryContext,
  getFiltersPreselectedByDataQueries,
  isStructureDataMapsReady,
  mergeConstraintsMaps,
} from '../multiple-filters';
import type { Filter, SharedFilter } from '../../models/filters';

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

jest.mock('@epam/statgpt-sdmx-toolkit', () => ({
  findCodelistByDimension: (...args: any[]) =>
    (mockFindCodelistByDimension as any)(...args),
  generateShortUrn: (...args: any[]) => (mockGenerateShortUrn as any)(...args),
  getAnnotationPeriod: jest.fn(() => ({ startPeriod: null, endPeriod: null })),
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
  getSeriesFilterDto: jest.fn(() => []),
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
  getQueryFilters: jest.fn(() => ({})),
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

describe('shared filter fallback for datasets with no matching source values', () => {
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

  it('does not apply fallback by default', () => {
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

  it('applies selected fallback codes to datasets with no matching source values', () => {
    const filtersMap = buildFiltersMap([sharedFreqFilter], undefined, true);
    const dsBFilter = filtersMap
      .get(DATASET_B_URN)
      ?.find((f) => f.id === COMMON_FREQUENCY_FILTER_ID);
    const ids = dsBFilter?.dimensionValues?.map((v) => v.id);

    expect(ids).toContain('Q');
    expect(ids).not.toContain('name:quarterly');
    expect(ids).not.toContain('ANNUAL');
    expect(
      dsBFilter?.dimensionValues?.find((v) => v.id === 'Q')?.isSelectedValue,
    ).toBe(true);
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

  it('multiple selected values are all propagated to the fallback dataset', () => {
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

    expect(dsBFilter?.dimensionValues).toHaveLength(2);
    expect(dsBFilter?.dimensionValues?.every((v) => v.isSelectedValue)).toBe(
      true,
    );

    expect(dsBFilter?.dimensionValues?.map((v) => v.id)).toEqual(
      expect.arrayContaining(['Q', 'M']),
    );
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
