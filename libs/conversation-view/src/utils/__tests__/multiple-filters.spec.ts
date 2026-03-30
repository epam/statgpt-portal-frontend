import {
  COMMON_COUNTRY_FILTER_ID,
  COMMON_FREQUENCY_FILTER_ID,
  buildFiltersMap,
  getConstraintsMap,
  getDatasetNameFromFilters,
  getFiltersForQueryContext,
  getFiltersPreselectedByDataQueries,
  isStructureDataMapsReady,
} from '../multiple-filters';
import type { Filter, SharedFilter } from '../../models/filters';

jest.mock('@epam/statgpt-sdmx-toolkit', () => ({
  generateShortUrn: jest.fn(
    (name, version, agencyId) => `${agencyId}:${name}(${version})`,
  ),
  getAnnotationPeriod: jest.fn(() => ({ startPeriod: null, endPeriod: null })),
  findCodelistByDimension: jest.fn(() => null),
  getAvailableCodesFromConstrains: jest.fn(() => []),
  TIME_PERIOD: 'TIME_PERIOD',
  TIME_PERIOD_START_ANNOTATION_KEY: 'TIME_PERIOD_START',
  TIME_PERIOD_END_ANNOTATION_KEY: 'TIME_PERIOD_END',
}));

jest.mock('../filters', () => ({
  getDatasetFilters: jest.fn(() => []),
  getFiltersPreselectedByDataQuery: jest.fn((filters: Filter[]) => filters),
}));

jest.mock('../get-filled-filters', () => ({
  getFilledFilters: jest.fn((filters: Filter[]) => filters),
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

// ─── Default mock reset ───────────────────────────────────────────────────────

beforeEach(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { generateShortUrn } = require('@epam/statgpt-sdmx-toolkit');
  generateShortUrn.mockImplementation(
    (name: string, version: string, agencyId: string) =>
      `${agencyId}:${name}(${version})`,
  );
});

const makeDatasetCountryFilter = (
  datasetUrn: string,
  values: Array<{ id: string; name?: string; isSelectedValue?: boolean }>,
): Filter => ({
  id: COMMON_COUNTRY_FILTER_ID,
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
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { generateShortUrn } = require('@epam/statgpt-sdmx-toolkit');

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
    expect(generateShortUrn).toHaveBeenCalledWith('DF_A', '', 'AGENCY');
    expect(result).toBe('AGENCY:DF_A()');
  });
});

// ─── getConstraintsMap ────────────────────────────────────────────────────────

describe('getConstraintsMap', () => {
  it('builds a map keyed by the short URN generated from each constraint', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { generateShortUrn } = require('@epam/statgpt-sdmx-toolkit');
    generateShortUrn.mockImplementation(
      (name: string, version: string, agencyId: string) =>
        `${agencyId}:${name}(${version})`,
    );

    const constraintsData = [
      {
        data: {
          dataConstraints: [{ id: 'DF_A', version: '1.0', agencyID: 'AGENCY' }],
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
});

// ─── FREQUENCY filter follows the same name-based merge strategy ─────────────

describe('merging frequency filters', () => {
  it('merges FREQUENCY filters from multiple datasets by name', () => {
    const freqFilterA: Filter = {
      id: COMMON_FREQUENCY_FILTER_ID,
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
  });
});
