import {
  getCodelistUrnForDatasetFilter,
  getSingleDatasetConstraintFilters,
  getSingleDatasetConstraintsRequest,
  getSingleDatasetFiltersFilledByConstraints,
  getSingleDatasetFiltersPreselectedByDataQuery,
} from '../single-dataset-filters';
import type {
  DataConstraints,
  Dimension,
  SeriesFilterDto,
  StructuralData,
  StructuralMetaData,
  StructureItemBase,
} from '@epam/statgpt-sdmx-toolkit';
import type { DataQuery } from '@epam/statgpt-shared-toolkit';
import type { Filter, FiltersProps } from '../../models/filters';

const mockFindCodelistByDimension = jest.fn();
const mockGenerateShortUrn = jest.fn(
  (id: string, version: string, agencyId: string) =>
    `${agencyId}:${id}(${version})`,
);
const mockGetAvailableCodesFromConstrains = jest.fn(() => [] as unknown[]);
const mockGetKeyFromUrn = jest.fn((urn?: string) =>
  urn ? `key:${urn}` : undefined,
);
const mockGetDatasetFilters = jest.fn(() => [] as Filter[]);
const mockGetFiltersPreselectedByDataQuery = jest.fn(
  (filters: Filter[]) => filters,
);
const mockGetSeriesFilterDto = jest.fn(() => [] as SeriesFilterDto[]);
const mockNormalizeConstraintFilters = jest.fn(
  (filters: SeriesFilterDto[]) => filters,
);
const mockBuildRequestCacheKey = jest.fn(() => 'cache-key');
const mockGetCachedRequestResult = jest.fn(
  (_getConstraints: unknown, _cacheKey: string, getRequest: () => unknown) =>
    getRequest(),
);
const mockIsRequestCached = jest.fn(() => false);

jest.mock('@epam/statgpt-sdmx-toolkit', () => ({
  findCodelistByDimension: (...args: any[]) =>
    (mockFindCodelistByDimension as any)(...args),
  generateShortUrn: (...args: any[]) => (mockGenerateShortUrn as any)(...args),
  getAvailableCodesFromConstrains: (...args: any[]) =>
    (mockGetAvailableCodesFromConstrains as any)(...args),
  getKeyFromUrn: (...args: any[]) => (mockGetKeyFromUrn as any)(...args),
  TIME_PERIOD: 'TIME_PERIOD',
}));

jest.mock('../filters', () => ({
  getDatasetFilters: (...args: any[]) =>
    (mockGetDatasetFilters as any)(...args),
  getFiltersPreselectedByDataQuery: (...args: any[]) =>
    (mockGetFiltersPreselectedByDataQuery as any)(...args),
}));

jest.mock('../get-series-filters', () => ({
  getSeriesFilterDto: (...args: any[]) =>
    (mockGetSeriesFilterDto as any)(...args),
}));

jest.mock('../normalize-constraint-filters', () => ({
  normalizeConstraintFilters: (...args: any[]) =>
    (mockNormalizeConstraintFilters as any)(...args),
}));

jest.mock('../request-cache', () => ({
  buildRequestCacheKey: (...args: any[]) =>
    (mockBuildRequestCacheKey as any)(...args),
  getCachedRequestResult: (...args: any[]) =>
    (mockGetCachedRequestResult as any)(...args),
  isRequestCached: (...args: any[]) => (mockIsRequestCached as any)(...args),
}));

const DATASET_URN = 'AGENCY:DF_TEST(1.0)';

const dimensions = [
  {
    id: 'COUNTRY',
    localRepresentation: { enumeration: 'urn:country-local' },
  },
  { id: 'FREQUENCY' },
] as Dimension[];

const structures = {
  codelists: [{ id: 'CL_COUNTRY' }],
  conceptSchemes: [{ id: 'CS_CONCEPTS' }],
} as unknown as StructuralData;

const structureDimensions = [
  { id: 'COUNTRY' },
] as unknown as StructureItemBase[];

const constraints = [{ id: 'constraints' }] as unknown as DataConstraints[];

const makeFilter = (id: string): Filter => ({
  id,
  title: id,
  filterType: 'dataset',
});

beforeEach(() => {
  jest.clearAllMocks();

  mockFindCodelistByDimension.mockReturnValue(undefined);
  mockGenerateShortUrn.mockImplementation(
    (id: string, version: string, agencyId: string) =>
      `${agencyId}:${id}(${version})`,
  );
  mockGetAvailableCodesFromConstrains.mockReturnValue([]);
  mockGetKeyFromUrn.mockImplementation((urn?: string) =>
    urn ? `key:${urn}` : undefined,
  );
  mockGetDatasetFilters.mockReturnValue([]);
  mockGetFiltersPreselectedByDataQuery.mockImplementation(
    (filters: Filter[]) => filters,
  );
  mockGetSeriesFilterDto.mockReturnValue([]);
  mockNormalizeConstraintFilters.mockImplementation(
    (filters: SeriesFilterDto[]) => filters,
  );
  mockBuildRequestCacheKey.mockReturnValue('cache-key');
  mockGetCachedRequestResult.mockImplementation(
    (_getConstraints: unknown, _cacheKey: string, getRequest: () => unknown) =>
      getRequest(),
  );
  mockIsRequestCached.mockReturnValue(false);
});

describe('getCodelistUrnForDatasetFilter', () => {
  it('returns undefined when the matching dimension is missing', () => {
    const result = getCodelistUrnForDatasetFilter(
      makeFilter('COUNTRY'),
      [{ id: 'FREQUENCY' }] as Dimension[],
      structures,
    );

    expect(result).toBeUndefined();
    expect(mockFindCodelistByDimension).not.toHaveBeenCalled();
  });

  it('prefers the local representation enumeration key', () => {
    mockGetKeyFromUrn.mockReturnValueOnce('country-local-key');

    const result = getCodelistUrnForDatasetFilter(
      makeFilter('COUNTRY'),
      dimensions,
      structures,
    );

    expect(result).toBe('country-local-key');
    expect(mockGetKeyFromUrn).toHaveBeenCalledWith('urn:country-local');
    expect(mockFindCodelistByDimension).not.toHaveBeenCalled();
  });

  it('uses the codelist urn key when the dimension has no local enumeration', () => {
    const codelist = {
      urn: 'urn:frequency-codelist',
      id: 'CL_FREQ',
      version: '1.0',
      agencyID: 'AGENCY',
    };

    mockFindCodelistByDimension.mockReturnValue(codelist);
    mockGetKeyFromUrn
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce('frequency-codelist-key');

    const result = getCodelistUrnForDatasetFilter(
      makeFilter('FREQUENCY'),
      dimensions,
      structures,
    );

    expect(result).toBe('frequency-codelist-key');
    expect(mockFindCodelistByDimension).toHaveBeenCalledWith(
      structures.codelists,
      structures.conceptSchemes,
      dimensions[1],
    );
    expect(mockGetKeyFromUrn).toHaveBeenCalledWith('urn:frequency-codelist');
  });

  it('falls back to a generated short urn when the codelist urn has no key', () => {
    mockFindCodelistByDimension.mockReturnValue({
      urn: 'urn:frequency-codelist',
      id: 'CL_FREQ',
      version: '1.0',
      agencyID: 'AGENCY',
    });
    mockGetKeyFromUrn.mockReturnValue(undefined);

    const result = getCodelistUrnForDatasetFilter(
      makeFilter('FREQUENCY'),
      dimensions,
      structures,
    );

    expect(result).toBe('AGENCY:CL_FREQ(1.0)');
    expect(mockGenerateShortUrn).toHaveBeenCalledWith(
      'CL_FREQ',
      '1.0',
      'AGENCY',
    );
  });
});

describe('getSingleDatasetConstraintFilters', () => {
  it('filters out TIME_PERIOD before normalizing request filters', () => {
    const filters = [makeFilter('COUNTRY')];
    const countryFilter = {
      componentCode: 'COUNTRY',
      operator: 'eq',
      value: 'FR',
    } as SeriesFilterDto;
    const timePeriodFilter = {
      componentCode: 'TIME_PERIOD',
      operator: 'eq',
      value: '2020',
    } as SeriesFilterDto;
    const normalizedFilters = [
      { componentCode: 'COUNTRY', operator: 'eq', value: 'DE,FR' },
    ] as SeriesFilterDto[];

    mockGetSeriesFilterDto.mockReturnValue([countryFilter, timePeriodFilter]);
    mockNormalizeConstraintFilters.mockReturnValue(normalizedFilters);

    expect(getSingleDatasetConstraintFilters(filters)).toBe(normalizedFilters);
    expect(mockGetSeriesFilterDto).toHaveBeenCalledWith(filters);
    expect(mockNormalizeConstraintFilters).toHaveBeenCalledWith([
      countryFilter,
    ]);
  });
});

describe('getSingleDatasetConstraintsRequest', () => {
  it('returns a resolved empty request when getConstraints is not provided', async () => {
    const result = getSingleDatasetConstraintsRequest(undefined, DATASET_URN, [
      makeFilter('COUNTRY'),
    ]);

    await expect(result.request).resolves.toBeUndefined();
    expect(result.shouldTrackLoading).toBe(false);
    expect(mockBuildRequestCacheKey).not.toHaveBeenCalled();
    expect(mockGetCachedRequestResult).not.toHaveBeenCalled();
  });

  it('builds a cached constraints request and tracks loading when the cache is cold', async () => {
    const constraintsResponse = {
      data: { dataConstraints: constraints },
    } as StructuralMetaData;
    const getConstraints = jest.fn(() => Promise.resolve(constraintsResponse));
    const constraintFilters = [
      { componentCode: 'COUNTRY', operator: 'eq', value: 'FR' },
    ] as SeriesFilterDto[];

    mockGetSeriesFilterDto.mockReturnValue(constraintFilters);
    mockNormalizeConstraintFilters.mockReturnValue(constraintFilters);
    mockBuildRequestCacheKey.mockReturnValue('country-cache-key');
    mockIsRequestCached.mockReturnValue(false);

    const result = getSingleDatasetConstraintsRequest(
      { getConstraints } as unknown as FiltersProps['actions'],
      DATASET_URN,
      [makeFilter('COUNTRY')],
    );

    await expect(result.request).resolves.toBe(constraintsResponse);
    expect(result.shouldTrackLoading).toBe(true);
    expect(mockBuildRequestCacheKey).toHaveBeenCalledWith(
      DATASET_URN,
      constraintFilters,
    );
    expect(mockGetCachedRequestResult).toHaveBeenCalledWith(
      getConstraints,
      'country-cache-key',
      expect.any(Function),
    );
    expect(mockIsRequestCached).toHaveBeenCalledWith(
      getConstraints,
      'country-cache-key',
    );
    expect(getConstraints).toHaveBeenCalledWith(DATASET_URN, constraintFilters);
  });

  it('does not track loading when the matching constraints request is cached', () => {
    const getConstraints = jest.fn(() =>
      Promise.resolve({} as StructuralMetaData),
    );

    mockIsRequestCached.mockReturnValue(true);

    const result = getSingleDatasetConstraintsRequest(
      { getConstraints } as unknown as FiltersProps['actions'],
      DATASET_URN,
      [makeFilter('COUNTRY')],
    );

    expect(result.shouldTrackLoading).toBe(false);
  });
});

describe('getSingleDatasetFiltersFilledByConstraints', () => {
  it('fills dataset filters with available values from matching constraints', () => {
    const countryFilter = makeFilter('COUNTRY');
    const frequencyFilter = makeFilter('FREQUENCY');
    const orphanFilter = makeFilter('INDICATOR');
    const countryValues = [{ id: 'FR', name: 'France' }];
    const frequencyValues = [{ id: 'A', name: 'Annual' }];

    mockGetDatasetFilters.mockReturnValue([
      countryFilter,
      frequencyFilter,
      orphanFilter,
    ]);
    mockFindCodelistByDimension
      .mockReturnValueOnce({ codes: ['FR', 'DE'] })
      .mockReturnValueOnce({ codes: ['A', 'M'] });
    mockGetAvailableCodesFromConstrains
      .mockReturnValueOnce(countryValues)
      .mockReturnValueOnce(frequencyValues);

    const result = getSingleDatasetFiltersFilledByConstraints({
      dimensions,
      structures,
      structureDimensions,
      locale: 'en',
      constraints,
    });

    expect(mockGetDatasetFilters).toHaveBeenCalledWith(
      dimensions,
      structures,
      structureDimensions,
      'en',
    );
    expect(mockGetAvailableCodesFromConstrains).toHaveBeenNthCalledWith(
      1,
      ['FR', 'DE'],
      'COUNTRY',
      constraints,
      'en',
    );
    expect(mockGetAvailableCodesFromConstrains).toHaveBeenNthCalledWith(
      2,
      ['A', 'M'],
      'FREQUENCY',
      constraints,
      'en',
    );
    expect(result).toEqual([
      { ...countryFilter, dimensionValues: countryValues },
      { ...frequencyFilter, dimensionValues: frequencyValues },
      { ...orphanFilter, dimensionValues: [] },
    ]);
  });
});

describe('getSingleDatasetFiltersPreselectedByDataQuery', () => {
  it('preselects data query values after filling filters with constraints', () => {
    const countryFilter = makeFilter('COUNTRY');
    const countryValues = [{ id: 'FR', name: 'France' }];
    const dataQuery = {
      urn: DATASET_URN,
      filters: [{ componentCode: 'COUNTRY', values: ['FR'] }],
    } as DataQuery;
    const preselectedFilters = [
      {
        ...countryFilter,
        dimensionValues: [{ id: 'FR', name: 'France', isSelectedValue: true }],
      },
    ] as Filter[];

    mockGetDatasetFilters.mockReturnValue([countryFilter]);
    mockFindCodelistByDimension.mockReturnValue({ codes: ['FR'] });
    mockGetAvailableCodesFromConstrains.mockReturnValue(countryValues);
    mockGetFiltersPreselectedByDataQuery.mockReturnValue(preselectedFilters);

    const result = getSingleDatasetFiltersPreselectedByDataQuery({
      dimensions: [dimensions[0]],
      structures,
      structureDimensions,
      locale: 'en',
      constraints,
      dataQuery,
    });

    expect(mockGetFiltersPreselectedByDataQuery).toHaveBeenCalledWith(
      [{ ...countryFilter, dimensionValues: countryValues }],
      dataQuery,
      constraints,
    );
    expect(result).toBe(preselectedFilters);
  });
});
