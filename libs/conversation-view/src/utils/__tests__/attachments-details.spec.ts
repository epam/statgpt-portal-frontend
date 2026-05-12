import { getAttachmentInfoList } from '../attachments-details';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockGetLocalizedName = jest.fn();
const mockGetDimensions = jest.fn();
const mockFindCodelistByDimension = jest.fn();
const mockGetConcept = jest.fn();
const mockGetSharedFilterIdForDatasetDimension = jest.fn();
const mockGetDateString = jest.fn();
const mockGetTimePeriod = jest.fn();

jest.mock('@epam/statgpt-sdmx-toolkit', () => ({
  getLocalizedName: (...args: any[]) => mockGetLocalizedName(...args),
  getDimensions: (...args: any[]) => mockGetDimensions(...args),
  findCodelistByDimension: (...args: any[]) =>
    mockFindCodelistByDimension(...args),
  getConcept: (...args: any[]) => mockGetConcept(...args),
}));

jest.mock('@epam/statgpt-shared-toolkit', () => ({
  QueryFilterType: { IN: 'in', BETWEEN: 'between', EXCLUDED: 'excluded' },
  getTimePeriod: (...args: any[]) => mockGetTimePeriod(...args),
}));

jest.mock('../attachments/time-period', () => ({
  getDateString: (...args: any[]) => mockGetDateString(...args),
}));

jest.mock('../multiple-filters', () => ({
  getSharedFilterIdForDatasetDimension: (...args: any[]) =>
    mockGetSharedFilterIdForDatasetDimension(...args),
}));

// ─── Constants ────────────────────────────────────────────────────────────────

const DATASET_A_URN = 'AGENCY:DF_A(1.0)';
const DATASET_B_URN = 'AGENCY:DF_B(1.0)';
const SHARED_FREQ_ID = 'SHARED_FREQ';
const LOCALE = 'en';

const emptyStructuresMap = new Map<string, any>([
  [DATASET_A_URN, {}],
  [DATASET_B_URN, {}],
]);

// ─── Default mock reset ───────────────────────────────────────────────────────

beforeEach(() => {
  mockGetLocalizedName.mockReturnValue(undefined);
  mockGetDimensions.mockReturnValue({ dimensions: [], timeDimensions: [] });
  mockFindCodelistByDimension.mockReturnValue(null);
  mockGetConcept.mockReturnValue(null);
  mockGetSharedFilterIdForDatasetDimension.mockImplementation(
    (_urn: string, componentCode: string) =>
      componentCode === 'FREQ' ? SHARED_FREQ_ID : componentCode,
  );
  mockGetDateString.mockReturnValue('2020-01');
  mockGetTimePeriod.mockReturnValue('2020');
});

// ─── helpers ─────────────────────────────────────────────────────────────────

const inFilter = (values: string[]) => ({
  componentCode: 'FREQ',
  operator: 'in',
  values,
});

const excludedFilter = () => ({
  componentCode: 'FREQ',
  operator: 'excluded',
  values: [],
});

// ─── getAttachmentInfoList ────────────────────────────────────────────────────

describe('getAttachmentInfoList', () => {
  it('shows values from a sibling dataset when one dataset changes to EXCLUDED', () => {
    const previousDataQueries = [
      { urn: DATASET_A_URN, filters: [inFilter(['M'])] },
      { urn: DATASET_B_URN, filters: [inFilter(['A'])] },
    ] as any[];
    const currentDataQueries = [
      { urn: DATASET_A_URN, filters: [inFilter(['D'])] },
      { urn: DATASET_B_URN, filters: [excludedFilter()] },
    ] as any[];

    const result = getAttachmentInfoList(
      previousDataQueries,
      currentDataQueries,
      emptyStructuresMap,
      LOCALE,
    );

    expect(result[0].queryFiltersDetails).toEqual([
      { id: SHARED_FREQ_ID, title: undefined, valuesTitles: ['D'] },
    ]);
    expect(result[1].queryFiltersDetails).toEqual([
      { id: SHARED_FREQ_ID, title: undefined, valuesTitles: ['D'] },
    ]);
  });

  it('shows sibling values for EXCLUDED even when the sibling filter did not change', () => {
    const previousDataQueries = [
      { urn: DATASET_A_URN, filters: [inFilter(['D'])] },
      { urn: DATASET_B_URN, filters: [inFilter(['A'])] },
    ] as any[];
    const currentDataQueries = [
      { urn: DATASET_A_URN, filters: [inFilter(['D'])] },
      { urn: DATASET_B_URN, filters: [excludedFilter()] },
    ] as any[];

    const result = getAttachmentInfoList(
      previousDataQueries,
      currentDataQueries,
      emptyStructuresMap,
      LOCALE,
    );

    expect(result[0].queryFiltersDetails).toEqual([]);
    expect(result[1].queryFiltersDetails).toEqual([
      { id: SHARED_FREQ_ID, title: undefined, valuesTitles: ['D'] },
    ]);
  });

  it('drops the filter entry when all datasets change to EXCLUDED and no sibling has active values', () => {
    const previousDataQueries = [
      { urn: DATASET_A_URN, filters: [inFilter(['D'])] },
      { urn: DATASET_B_URN, filters: [inFilter(['A'])] },
    ] as any[];
    const currentDataQueries = [
      { urn: DATASET_A_URN, filters: [excludedFilter()] },
      { urn: DATASET_B_URN, filters: [excludedFilter()] },
    ] as any[];

    const result = getAttachmentInfoList(
      previousDataQueries,
      currentDataQueries,
      emptyStructuresMap,
      LOCALE,
    );

    expect(result[0].queryFiltersDetails).toEqual([]);
    expect(result[1].queryFiltersDetails).toEqual([]);
  });

  it('returns normal changed filter details when no EXCLUDED filters are involved', () => {
    const previousDataQueries = [
      { urn: DATASET_A_URN, filters: [inFilter(['M'])] },
    ] as any[];
    const currentDataQueries = [
      { urn: DATASET_A_URN, filters: [inFilter(['D'])] },
    ] as any[];

    const result = getAttachmentInfoList(
      previousDataQueries,
      currentDataQueries,
      new Map([[DATASET_A_URN, {}]]) as any,
      LOCALE,
    );

    expect(result[0].queryFiltersDetails).toEqual([
      { id: SHARED_FREQ_ID, title: undefined, valuesTitles: ['D'] },
    ]);
  });

  it('returns empty details when the filter did not change', () => {
    const filters = [inFilter(['D'])];
    const dataQueries = [{ urn: DATASET_A_URN, filters }] as any[];

    const result = getAttachmentInfoList(
      dataQueries,
      dataQueries,
      new Map([[DATASET_A_URN, {}]]) as any,
      LOCALE,
    );

    expect(result[0].queryFiltersDetails).toEqual([]);
  });
});
