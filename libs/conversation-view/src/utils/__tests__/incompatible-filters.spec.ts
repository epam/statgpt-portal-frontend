import {
  cleanIncompatibleDatasetFilters,
  cleanIncompatibleFilters,
  cleanIncompatibleFiltersMap,
  getIncompatibleSelectedValueIds,
} from '../incompatible-filters';
import type { Filter } from '../../models/filters';
import type { StructureDataMaps } from '../../models/structure-data';

// ─── Mock functions ───────────────────────────────────────────────────────────

const mockFindCodelistByDimension = jest.fn();
const mockGetAvailableCodesFromConstrains = jest.fn();
const mockGetNativeFilterIdForSharedFilter = jest.fn();

jest.mock('@epam/statgpt-sdmx-toolkit', () => ({
  findCodelistByDimension: (...args: any[]) =>
    (mockFindCodelistByDimension as any)(...args),
  getAvailableCodesFromConstrains: (...args: any[]) =>
    (mockGetAvailableCodesFromConstrains as any)(...args),
}));

jest.mock('../multiple-filters', () => ({
  getNativeFilterIdForSharedFilter: (...args: any[]) =>
    (mockGetNativeFilterIdForSharedFilter as any)(...args),
}));

// ─── Helpers ────────────────────────────────────────────────────────────────

type Code = { id: string };

const setupCodes = (
  codelistByDim: Record<string, Code[]>,
  availableByDim: Record<string, Code[]>,
) => {
  mockFindCodelistByDimension.mockImplementation((_cl, _cs, dimension) =>
    dimension && codelistByDim[dimension.id]
      ? { codes: codelistByDim[dimension.id] }
      : null,
  );
  mockGetAvailableCodesFromConstrains.mockImplementation(
    (codes: Code[], dimensionId: string) =>
      availableByDim[dimensionId] ?? codes,
  );
};

const datasetFilter = (
  id: string,
  selectedIds: string[],
  overrides: Partial<Filter> = {},
): Filter => ({
  id,
  filterType: 'dataset',
  dimensionValues: selectedIds.map((valueId) => ({
    id: valueId,
    isSelectedValue: true,
  })),
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockFindCodelistByDimension.mockReturnValue(null);
  mockGetAvailableCodesFromConstrains.mockReturnValue([]);
  mockGetNativeFilterIdForSharedFilter.mockReturnValue(undefined);
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('getIncompatibleSelectedValueIds', () => {
  it('flags selected codelist values that are no longer available', () => {
    setupCodes({ FREQ: [{ id: 'D' }, { id: 'M' }] }, { FREQ: [{ id: 'M' }] });
    const filter = datasetFilter('FREQ', ['D', 'M']);

    const result = getIncompatibleSelectedValueIds(
      filter,
      { id: 'FREQ' } as any,
      {} as any,
      [],
    );

    expect([...result]).toEqual(['D']);
  });

  it('does not flag hierarchy-only values absent from the codelist', () => {
    setupCodes({ FREQ: [{ id: 'M' }] }, { FREQ: [{ id: 'M' }] });
    const filter = datasetFilter('FREQ', ['HIER_NODE', 'M']);

    const result = getIncompatibleSelectedValueIds(
      filter,
      { id: 'FREQ' } as any,
      {} as any,
      [],
    );

    expect(result.size).toBe(0);
  });

  it('does not flag values that are still available', () => {
    setupCodes(
      { FREQ: [{ id: 'D' }, { id: 'M' }] },
      { FREQ: [{ id: 'D' }, { id: 'M' }] },
    );
    const filter = datasetFilter('FREQ', ['D']);

    const result = getIncompatibleSelectedValueIds(
      filter,
      { id: 'FREQ' } as any,
      {} as any,
      [],
    );

    expect(result.size).toBe(0);
  });

  it('returns empty when the dimension is missing', () => {
    const filter = datasetFilter('FREQ', ['D']);

    expect(
      getIncompatibleSelectedValueIds(filter, undefined, {} as any, []).size,
    ).toBe(0);
  });

  it('returns empty when no codelist is found', () => {
    mockFindCodelistByDimension.mockReturnValue(null);
    const filter = datasetFilter('FREQ', ['D']);

    expect(
      getIncompatibleSelectedValueIds(
        filter,
        { id: 'FREQ' } as any,
        {} as any,
        [],
      ).size,
    ).toBe(0);
  });

  it('returns empty when constraints are empty (availability = full codelist)', () => {
    setupCodes({ FREQ: [{ id: 'D' }, { id: 'M' }] }, {});
    const filter = datasetFilter('FREQ', ['D', 'M']);

    expect(
      getIncompatibleSelectedValueIds(
        filter,
        { id: 'FREQ' } as any,
        {} as any,
        [],
      ).size,
    ).toBe(0);
  });

  it('returns empty for a time dimension', () => {
    setupCodes({ TIME: [{ id: 'D' }] }, { TIME: [] });
    const filter = datasetFilter('TIME', ['D'], { isTimeDimension: true });

    expect(
      getIncompatibleSelectedValueIds(
        filter,
        { id: 'TIME' } as any,
        {} as any,
        [],
      ).size,
    ).toBe(0);
  });

  it('returns empty when nothing is selected', () => {
    setupCodes({ FREQ: [{ id: 'D' }] }, { FREQ: [] });
    const filter = datasetFilter('FREQ', []);

    expect(
      getIncompatibleSelectedValueIds(
        filter,
        { id: 'FREQ' } as any,
        {} as any,
        [],
      ).size,
    ).toBe(0);
  });
});

describe('cleanIncompatibleDatasetFilters', () => {
  const dimensions = [{ id: 'EER_TYPE' }, { id: 'FREQ' }] as any[];

  it('unselects incompatible values but leaves the excluded filter untouched', () => {
    setupCodes(
      {
        EER_TYPE: [{ id: 'N' }, { id: 'R' }],
        FREQ: [{ id: 'D' }, { id: 'M' }],
      },
      {
        EER_TYPE: [{ id: 'N' }],
        FREQ: [{ id: 'M' }],
      },
    );
    const filters = [
      datasetFilter('EER_TYPE', ['R']),
      datasetFilter('FREQ', ['D']),
    ];

    const { filters: cleaned, changed } = cleanIncompatibleDatasetFilters(
      filters,
      dimensions,
      {} as any,
      [],
      'FREQ',
    );

    expect(changed).toBe(true);
    const eerType = cleaned.find((f) => f.id === 'EER_TYPE');
    const freq = cleaned.find((f) => f.id === 'FREQ');
    expect(eerType?.dimensionValues?.[0].isSelectedValue).toBe(false);
    expect(freq?.dimensionValues?.[0].isSelectedValue).toBe(true);
  });

  it('returns the original array and changed=false when nothing is incompatible', () => {
    setupCodes(
      { EER_TYPE: [{ id: 'N' }, { id: 'R' }] },
      { EER_TYPE: [{ id: 'N' }, { id: 'R' }] },
    );
    const filters = [datasetFilter('EER_TYPE', ['N'])];

    const result = cleanIncompatibleDatasetFilters(
      filters,
      dimensions,
      {} as any,
      [],
      undefined,
    );

    expect(result.changed).toBe(false);
    expect(result.filters).toBe(filters);
  });

  it('skips time dimensions', () => {
    setupCodes({ TIME: [{ id: 'D' }] }, { TIME: [] });
    const filters = [datasetFilter('TIME', ['D'], { isTimeDimension: true })];

    const result = cleanIncompatibleDatasetFilters(
      filters,
      [{ id: 'TIME' }] as any[],
      {} as any,
      [],
      undefined,
    );

    expect(result.changed).toBe(false);
  });
});

describe('cleanIncompatibleFilters', () => {
  it('keeps the just-changed filter and clears conflicting older selections (sibling scenario)', () => {
    setupCodes(
      {
        COUNTRY: [{ id: 'ALB' }, { id: 'ARG' }],
        COUNTERPART: [{ id: 'FZ' }, { id: 'ARG' }],
      },
      {
        COUNTRY: [{ id: 'ARG' }],
        COUNTERPART: [{ id: 'FZ' }, { id: 'ARG' }],
      },
    );
    const filters = [
      datasetFilter('COUNTRY', ['ALB', 'ARG']),
      datasetFilter('COUNTERPART', ['FZ']),
    ];
    const changedFilter = filters[1];

    const { filters: cleaned, changed } = cleanIncompatibleFilters(
      filters,
      [{ id: 'COUNTRY' }, { id: 'COUNTERPART' }] as any[],
      {} as any,
      [],
      changedFilter,
    );

    expect(changed).toBe(true);
    const country = cleaned.find((f) => f.id === 'COUNTRY');
    expect(
      country?.dimensionValues?.find((v) => v.id === 'ALB')?.isSelectedValue,
    ).toBe(false);
    expect(
      country?.dimensionValues?.find((v) => v.id === 'ARG')?.isSelectedValue,
    ).toBe(true);
    const counterpart = cleaned.find((f) => f.id === 'COUNTERPART');
    expect(counterpart?.dimensionValues?.[0].isSelectedValue).toBe(true);
  });
});

describe('cleanIncompatibleFiltersMap', () => {
  const DATASET_A = 'AGENCY:DF_A(1.0)';
  const DATASET_B = 'AGENCY:DF_B(1.0)';

  const buildStructureDataMaps = (): StructureDataMaps =>
    ({
      dimensionsMap: new Map<string, any[]>([
        [DATASET_A, [{ id: 'COUNTRY_A' }]],
        [DATASET_B, [{ id: 'COUNTRY_B' }]],
      ]),
      structuresMap: new Map([
        [DATASET_A, {} as any],
        [DATASET_B, {} as any],
      ]),
      constraintsMap: new Map([
        [DATASET_A, []],
        [DATASET_B, []],
      ]),
    }) as unknown as StructureDataMaps;

  it('cleans only the dataset where the shared value is incompatible', () => {
    setupCodes(
      {
        COUNTRY_A: [{ id: 'ALB' }, { id: 'ARG' }],
        COUNTRY_B: [{ id: 'ALB' }, { id: 'ARG' }],
      },
      {
        COUNTRY_A: [{ id: 'ALB' }, { id: 'ARG' }],
        COUNTRY_B: [{ id: 'ARG' }],
      },
    );
    const filtersMap = new Map<string, Filter[]>([
      [
        DATASET_A,
        [datasetFilter('COUNTRY_A', ['ALB', 'ARG'], { datasetUrn: DATASET_A })],
      ],
      [
        DATASET_B,
        [datasetFilter('COUNTRY_B', ['ALB', 'ARG'], { datasetUrn: DATASET_B })],
      ],
    ]);
    mockGetNativeFilterIdForSharedFilter.mockReturnValue(undefined);

    const { filtersMap: cleaned, changed } = cleanIncompatibleFiltersMap(
      filtersMap,
      buildStructureDataMaps(),
      { id: 'COUNTERPART', filterType: 'shared' } as any,
    );

    expect(changed).toBe(true);
    const aValues = cleaned.get(DATASET_A)?.[0].dimensionValues;
    const bValues = cleaned.get(DATASET_B)?.[0].dimensionValues;
    expect(aValues?.find((v) => v.id === 'ALB')?.isSelectedValue).toBe(true);
    expect(bValues?.find((v) => v.id === 'ALB')?.isSelectedValue).toBe(false);
    expect(bValues?.find((v) => v.id === 'ARG')?.isSelectedValue).toBe(true);
  });

  it('excludes a shared changed filter using its per-dataset native id', () => {
    setupCodes(
      { COUNTRY_A: [{ id: 'ALB' }, { id: 'ARG' }] },
      { COUNTRY_A: [{ id: 'ARG' }] },
    );
    const filtersMap = new Map<string, Filter[]>([
      [
        DATASET_A,
        [datasetFilter('COUNTRY_A', ['ALB', 'ARG'], { datasetUrn: DATASET_A })],
      ],
    ]);
    mockGetNativeFilterIdForSharedFilter.mockImplementation((_filter, urn) =>
      urn === DATASET_A ? 'COUNTRY_A' : undefined,
    );

    const structureDataMaps = {
      dimensionsMap: new Map([[DATASET_A, [{ id: 'COUNTRY_A' }]]]),
      structuresMap: new Map([[DATASET_A, {} as any]]),
      constraintsMap: new Map([[DATASET_A, []]]),
    } as unknown as StructureDataMaps;

    const { changed } = cleanIncompatibleFiltersMap(
      filtersMap,
      structureDataMaps,
      { id: 'COUNTRY', filterType: 'shared' } as any,
    );

    expect(changed).toBe(false);
  });

  it('excludes a dataset changed filter only within its own dataset', () => {
    setupCodes(
      {
        FREQ: [{ id: 'D' }, { id: 'M' }],
        FREQ_B: [{ id: 'D' }, { id: 'M' }],
      },
      {
        FREQ: [{ id: 'M' }],
        FREQ_B: [{ id: 'M' }],
      },
    );
    const filtersMap = new Map<string, Filter[]>([
      [DATASET_A, [datasetFilter('FREQ', ['D'], { datasetUrn: DATASET_A })]],
      [DATASET_B, [datasetFilter('FREQ_B', ['D'], { datasetUrn: DATASET_B })]],
    ]);

    const structureDataMaps = {
      dimensionsMap: new Map<string, any[]>([
        [DATASET_A, [{ id: 'FREQ' }]],
        [DATASET_B, [{ id: 'FREQ_B' }]],
      ]),
      structuresMap: new Map([
        [DATASET_A, {} as any],
        [DATASET_B, {} as any],
      ]),
      constraintsMap: new Map([
        [DATASET_A, []],
        [DATASET_B, []],
      ]),
    } as unknown as StructureDataMaps;

    const { filtersMap: cleaned, changed } = cleanIncompatibleFiltersMap(
      filtersMap,
      structureDataMaps,
      { id: 'FREQ', filterType: 'dataset', datasetUrn: DATASET_A } as any,
    );

    expect(mockGetNativeFilterIdForSharedFilter).not.toHaveBeenCalled();
    expect(changed).toBe(true);
    expect(
      cleaned.get(DATASET_A)?.[0].dimensionValues?.[0].isSelectedValue,
    ).toBe(true);
    expect(
      cleaned.get(DATASET_B)?.[0].dimensionValues?.[0].isSelectedValue,
    ).toBe(false);
  });
});
