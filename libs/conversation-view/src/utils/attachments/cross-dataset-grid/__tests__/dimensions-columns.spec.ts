import {
  DatasetDimensionsScheme,
  StructuralData,
  getDimensions,
  getDimensionTitle,
  getConcept,
  getArtifactByUrnWithWildCard,
  getLocalizedName,
} from '@epam/statgpt-sdmx-toolkit';
import { ColDef } from 'ag-grid-community';
import { GridData } from '../../../../types/data-grid/grid-data';
import {
  COUNTRY_COL_ID,
  DEFAULT_COUNTRY_COL_TITLE,
  DEFAULT_FREQUENCY_COL_TITLE,
  DEFAULT_INDICATOR_COL_TITLE,
  FREQUENCY_COL_ID,
  INDICATOR_COL_ID,
  INDICATORS_CONCATENATION_SYMBOL,
} from '../../../../constants/cross-dataset-grid';
import {
  getCrossDatasetDimensionsColumns,
  getDimensionValue,
} from '../dimensions-columns';

jest.mock('@epam/statgpt-sdmx-toolkit', () => ({
  getDimensions: jest.fn(),
  getDimensionTitle: jest.fn(),
  getConcept: jest.fn(),
  getArtifactByUrnWithWildCard: jest.fn(),
  getLocalizedName: jest.fn(),
}));

const mockGetDimensions = getDimensions as jest.Mock;
const mockGetDimensionTitle = getDimensionTitle as jest.Mock;
const mockGetConcept = getConcept as jest.Mock;
const mockGetArtifactByUrnWithWildCard =
  getArtifactByUrnWithWildCard as jest.Mock;
const mockGetLocalizedName = getLocalizedName as jest.Mock;

// ---------------------------------------------------------------------------
// Factories
// ---------------------------------------------------------------------------

const LOCALE = 'en';
const URN_1 =
  'urn:sdmx:org.sdmx.infomodel.datastructure.DataStructure=OECD:DSD1(1.0)';
const URN_2 =
  'urn:sdmx:org.sdmx.infomodel.datastructure.DataStructure=OECD:DSD2(1.0)';

const makeScheme = (
  overrides: Partial<DatasetDimensionsScheme> = {},
): DatasetDimensionsScheme => ({
  timePeriod: 'TIME_PERIOD',
  frequency: 'FREQ',
  region: 'REF_AREA',
  indicators: ['INDICATOR'],
  other: [],
  ...overrides,
});

const makeStructures = (): StructuralData => ({
  dataStructures: [],
  codelists: [],
  conceptSchemes: [],
});

const makeRowData = (
  urn: string,
  parsedTimeSeriesValues: string[],
): GridData => ({
  dataset: { urn },
  originalData: { parsedTimeSeriesValue: parsedTimeSeriesValues },
});

const makeStructuresMap = (
  entries: [string, StructuralData | undefined][] = [],
): Map<string, StructuralData | undefined> => new Map(entries);

const makeSchemesMap = (
  entries: [string, DatasetDimensionsScheme | undefined][] = [],
): Map<string, DatasetDimensionsScheme | undefined> => new Map(entries);

function callValueGetter(colDef: ColDef, data: GridData): string | undefined {
  const vg = colDef.valueGetter;
  if (typeof vg !== 'function') return undefined;

  return (vg as (p) => string | undefined)({ data });
}

function findCol(cols: ColDef[], colId: string): ColDef {
  const col = cols.find((c) => c.colId === colId);
  if (!col) throw new Error(`Column "${colId}" not found`);
  return col;
}

// ---------------------------------------------------------------------------
// getDimensionValue
// ---------------------------------------------------------------------------

describe('getDimensionValue', () => {
  const structures = makeStructures();

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns the localized name for a dimension code found in the row data', () => {
    mockGetDimensions.mockReturnValue({
      dimensions: [
        {
          id: 'REF_AREA',
          conceptIdentity: 'urn:OECD:CS(1.0).REF_AREA',
          position: 0,
        },
      ],
    });
    mockGetConcept.mockReturnValue({
      coreRepresentation: { enumeration: 'urn:OECD:CL_AREA(1.0)' },
    });
    mockGetArtifactByUrnWithWildCard.mockReturnValue({ codes: [{ id: 'US' }] });
    mockGetLocalizedName.mockReturnValue('United States');

    const result = getDimensionValue(
      structures,
      'REF_AREA',
      makeRowData(URN_1, ['US']),
      LOCALE,
    );

    expect(result).toBe('United States');
  });

  it('returns undefined when the dimension id is not in the dimension list', () => {
    mockGetDimensions.mockReturnValue({
      dimensions: [{ id: 'OTHER_DIM', conceptIdentity: 'urn:x', position: 0 }],
    });

    const result = getDimensionValue(
      structures,
      'REF_AREA',
      makeRowData(URN_1, ['US']),
      LOCALE,
    );

    expect(result).toBeUndefined();
  });

  it('returns undefined when the structural data has no dimension list', () => {
    mockGetDimensions.mockReturnValue(undefined);

    const result = getDimensionValue(
      structures,
      'REF_AREA',
      makeRowData(URN_1, []),
      LOCALE,
    );

    expect(result).toBeUndefined();
  });

  it('returns undefined when the dimension list has no entries', () => {
    mockGetDimensions.mockReturnValue({});

    const result = getDimensionValue(
      structures,
      'REF_AREA',
      makeRowData(URN_1, []),
      LOCALE,
    );

    expect(result).toBeUndefined();
  });

  it('returns undefined when no codelist code matches the row value', () => {
    mockGetDimensions.mockReturnValue({
      dimensions: [{ id: 'REF_AREA', conceptIdentity: 'urn:x', position: 0 }],
    });
    mockGetConcept.mockReturnValue({ coreRepresentation: {} });
    mockGetArtifactByUrnWithWildCard.mockReturnValue({ codes: [{ id: 'FR' }] });
    mockGetLocalizedName.mockReturnValue(undefined);

    const result = getDimensionValue(
      structures,
      'REF_AREA',
      makeRowData(URN_1, ['US']),
      LOCALE,
    );

    expect(result).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// getCrossDatasetDimensionsColumns
// ---------------------------------------------------------------------------

describe('getCrossDatasetDimensionsColumns', () => {
  const urn = URN_1;
  const structures = makeStructures();

  beforeEach(() => {
    jest.resetAllMocks();
  });

  // -------------------------------------------------------------------------
  // Column structure
  // -------------------------------------------------------------------------

  describe('column structure', () => {
    it('returns exactly 3 columns when other is empty', () => {
      const cols = getCrossDatasetDimensionsColumns(
        makeStructuresMap([[urn, structures]]),
        makeSchemesMap([[urn, makeScheme({ other: [] })]]),
        LOCALE,
      );

      expect(cols).toHaveLength(3);
    });

    it('includes country, indicator and frequency columns', () => {
      const cols = getCrossDatasetDimensionsColumns(
        makeStructuresMap([[urn, structures]]),
        makeSchemesMap([[urn, makeScheme()]]),
        LOCALE,
      );

      const ids = cols.map((c) => c.colId);
      expect(ids).toContain(COUNTRY_COL_ID);
      expect(ids).toContain(INDICATOR_COL_ID);
      expect(ids).toContain(FREQUENCY_COL_ID);
    });

    it('uses default header names when no titles are provided', () => {
      const cols = getCrossDatasetDimensionsColumns(
        makeStructuresMap([[urn, structures]]),
        makeSchemesMap([[urn, makeScheme()]]),
        LOCALE,
      );

      expect(findCol(cols, COUNTRY_COL_ID).headerName).toBe(
        DEFAULT_COUNTRY_COL_TITLE,
      );
      expect(findCol(cols, INDICATOR_COL_ID).headerName).toBe(
        DEFAULT_INDICATOR_COL_TITLE,
      );
      expect(findCol(cols, FREQUENCY_COL_ID).headerName).toBe(
        DEFAULT_FREQUENCY_COL_TITLE,
      );
    });

    it('applies custom titles for country, indicator and frequency columns', () => {
      const titles = {
        countryDimensions: 'Region',
        indicatorDimensions: 'Metric',
        frequency: 'Period',
      };

      const cols = getCrossDatasetDimensionsColumns(
        makeStructuresMap([[urn, structures]]),
        makeSchemesMap([[urn, makeScheme()]]),
        LOCALE,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        titles as any,
      );

      expect(findCol(cols, COUNTRY_COL_ID).headerName).toBe('Region');
      expect(findCol(cols, INDICATOR_COL_ID).headerName).toBe('Metric');
      expect(findCol(cols, FREQUENCY_COL_ID).headerName).toBe('Period');
    });

    it('appends one column per unique other dimension', () => {
      const cols = getCrossDatasetDimensionsColumns(
        makeStructuresMap([[urn, structures]]),
        makeSchemesMap([[urn, makeScheme({ other: ['SECTOR', 'ACTIVITY'] })]]),
        LOCALE,
      );

      expect(cols).toHaveLength(5);
      expect(cols.map((c) => c.colId)).toContain('SECTOR');
      expect(cols.map((c) => c.colId)).toContain('ACTIVITY');
    });

    it('deduplicates other dimensions that appear in multiple schemes', () => {
      const cols = getCrossDatasetDimensionsColumns(
        makeStructuresMap([
          [URN_1, structures],
          [URN_2, structures],
        ]),
        makeSchemesMap([
          [URN_1, makeScheme({ other: ['SECTOR', 'ACTIVITY'] })],
          [URN_2, makeScheme({ other: ['SECTOR'] })],
        ]),
        LOCALE,
      );

      expect(cols).toHaveLength(5); // 3 standard + 2 unique (SECTOR, ACTIVITY)
    });

    it('passes colId in cellRendererParams for each column', () => {
      const cols = getCrossDatasetDimensionsColumns(
        makeStructuresMap([[urn, structures]]),
        makeSchemesMap([[urn, makeScheme({ other: ['SECTOR'] })]]),
        LOCALE,
      );

      for (const col of cols) {
        expect((col.cellRendererParams as Record<string, unknown>).colId).toBe(
          col.colId,
        );
      }
    });
  });

  // -------------------------------------------------------------------------
  // Country column — valueGetter
  // -------------------------------------------------------------------------

  describe('country column — valueGetter', () => {
    it("returns the localized name for the row's region code", () => {
      const cols = getCrossDatasetDimensionsColumns(
        makeStructuresMap([[urn, structures]]),
        makeSchemesMap([[urn, makeScheme({ region: 'REF_AREA' })]]),
        LOCALE,
      );
      mockGetDimensions.mockReturnValue({
        dimensions: [{ id: 'REF_AREA', conceptIdentity: 'urn:x', position: 0 }],
      });
      mockGetConcept.mockReturnValue({ coreRepresentation: {} });
      mockGetArtifactByUrnWithWildCard.mockReturnValue({
        codes: [{ id: 'US' }],
      });
      mockGetLocalizedName.mockReturnValue('United States');

      const result = callValueGetter(
        findCol(cols, COUNTRY_COL_ID),
        makeRowData(urn, ['US']),
      );

      expect(result).toBe('United States');
    });

    it("returns '' when the row has no dataset urn", () => {
      const cols = getCrossDatasetDimensionsColumns(
        makeStructuresMap([[urn, structures]]),
        makeSchemesMap([[urn, makeScheme()]]),
        LOCALE,
      );

      const result = callValueGetter(
        findCol(cols, COUNTRY_COL_ID),
        {} as GridData,
      );

      expect(result).toBe('');
    });

    it("returns '' when region is not defined in the scheme", () => {
      const cols = getCrossDatasetDimensionsColumns(
        makeStructuresMap([[urn, structures]]),
        makeSchemesMap([[urn, makeScheme({ region: undefined })]]),
        LOCALE,
      );

      const result = callValueGetter(
        findCol(cols, COUNTRY_COL_ID),
        makeRowData(urn, ['US']),
      );

      expect(result).toBe('');
    });

    it("returns '' when the urn is absent from structuresMap", () => {
      const cols = getCrossDatasetDimensionsColumns(
        makeStructuresMap(), // empty
        makeSchemesMap([[urn, makeScheme()]]),
        LOCALE,
      );

      const result = callValueGetter(
        findCol(cols, COUNTRY_COL_ID),
        makeRowData(urn, ['US']),
      );

      expect(result).toBe('');
    });
  });

  // -------------------------------------------------------------------------
  // Indicator column — valueGetter
  // -------------------------------------------------------------------------

  describe('indicator column — valueGetter', () => {
    it('returns concatenated localized names for multiple indicator dimensions', () => {
      const cols = getCrossDatasetDimensionsColumns(
        makeStructuresMap([[urn, structures]]),
        makeSchemesMap([
          [urn, makeScheme({ indicators: ['MEASURE', 'UNIT'] })],
        ]),
        LOCALE,
      );
      mockGetDimensions.mockReturnValue({
        dimensions: [
          { id: 'MEASURE', conceptIdentity: 'urn:x', position: 0 },
          { id: 'UNIT', conceptIdentity: 'urn:y', position: 1 },
        ],
      });
      mockGetConcept.mockReturnValue({ coreRepresentation: {} });
      mockGetArtifactByUrnWithWildCard.mockReturnValue({
        codes: [{ id: 'GDP' }, { id: 'USD' }],
      });
      mockGetLocalizedName
        .mockReturnValueOnce('Gross Domestic Product')
        .mockReturnValueOnce('US Dollar');

      const result = callValueGetter(
        findCol(cols, INDICATOR_COL_ID),
        makeRowData(urn, ['GDP', 'USD']),
      );

      expect(result).toBe(
        `Gross Domestic Product${INDICATORS_CONCATENATION_SYMBOL}US Dollar`,
      );
    });

    it("returns '' when the indicators array is empty", () => {
      const cols = getCrossDatasetDimensionsColumns(
        makeStructuresMap([[urn, structures]]),
        makeSchemesMap([[urn, makeScheme({ indicators: [] })]]),
        LOCALE,
      );

      const result = callValueGetter(
        findCol(cols, INDICATOR_COL_ID),
        makeRowData(urn, []),
      );

      expect(result).toBe('');
    });

    it("returns '' when the row has no dataset urn", () => {
      const cols = getCrossDatasetDimensionsColumns(
        makeStructuresMap([[urn, structures]]),
        makeSchemesMap([[urn, makeScheme()]]),
        LOCALE,
      );

      const result = callValueGetter(
        findCol(cols, INDICATOR_COL_ID),
        {} as GridData,
      );

      expect(result).toBe('');
    });
  });

  // -------------------------------------------------------------------------
  // Frequency column — valueGetter
  // -------------------------------------------------------------------------

  describe('frequency column — valueGetter', () => {
    it("returns the localized name for the row's frequency code", () => {
      const cols = getCrossDatasetDimensionsColumns(
        makeStructuresMap([[urn, structures]]),
        makeSchemesMap([[urn, makeScheme({ frequency: 'FREQ' })]]),
        LOCALE,
      );
      mockGetDimensions.mockReturnValue({
        dimensions: [{ id: 'FREQ', conceptIdentity: 'urn:x', position: 0 }],
      });
      mockGetConcept.mockReturnValue({ coreRepresentation: {} });
      mockGetArtifactByUrnWithWildCard.mockReturnValue({
        codes: [{ id: 'A' }],
      });
      mockGetLocalizedName.mockReturnValue('Annual');

      const result = callValueGetter(
        findCol(cols, FREQUENCY_COL_ID),
        makeRowData(urn, ['A']),
      );

      expect(result).toBe('Annual');
    });

    it("returns '' when frequency is not defined in the scheme", () => {
      const cols = getCrossDatasetDimensionsColumns(
        makeStructuresMap([[urn, structures]]),
        makeSchemesMap([[urn, makeScheme({ frequency: undefined })]]),
        LOCALE,
      );

      const result = callValueGetter(
        findCol(cols, FREQUENCY_COL_ID),
        makeRowData(urn, ['A']),
      );

      expect(result).toBe('');
    });
  });

  // -------------------------------------------------------------------------
  // Other dimension columns
  // -------------------------------------------------------------------------

  describe('other dimension columns', () => {
    describe('valueGetter', () => {
      it("returns the localized name when the dimension belongs to the row's dataset scheme", () => {
        const cols = getCrossDatasetDimensionsColumns(
          makeStructuresMap([[urn, structures]]),
          makeSchemesMap([[urn, makeScheme({ other: ['SECTOR'] })]]),
          LOCALE,
        );
        mockGetDimensions.mockReturnValue({
          dimensions: [{ id: 'SECTOR', conceptIdentity: 'urn:x', position: 0 }],
        });
        mockGetConcept.mockReturnValue({ coreRepresentation: {} });
        mockGetArtifactByUrnWithWildCard.mockReturnValue({
          codes: [{ id: 'AGRI' }],
        });
        mockGetLocalizedName.mockReturnValue('Agriculture');

        const result = callValueGetter(
          findCol(cols, 'SECTOR'),
          makeRowData(urn, ['AGRI']),
        );

        expect(result).toBe('Agriculture');
      });

      it("returns '' when the row's dataset does not include that dimension in other", () => {
        // Column exists because URN_1 declares SECTOR, but URN_2 rows should get empty
        const cols = getCrossDatasetDimensionsColumns(
          makeStructuresMap([
            [URN_1, structures],
            [URN_2, structures],
          ]),
          makeSchemesMap([
            [URN_1, makeScheme({ other: ['SECTOR'] })],
            [URN_2, makeScheme({ other: [] })],
          ]),
          LOCALE,
        );

        const result = callValueGetter(
          findCol(cols, 'SECTOR'),
          makeRowData(URN_2, ['AGRI']),
        );

        expect(result).toBe('');
      });

      it("returns '' when the row has no dataset urn", () => {
        const cols = getCrossDatasetDimensionsColumns(
          makeStructuresMap([[urn, structures]]),
          makeSchemesMap([[urn, makeScheme({ other: ['SECTOR'] })]]),
          LOCALE,
        );

        const result = callValueGetter(findCol(cols, 'SECTOR'), {} as GridData);

        expect(result).toBe('');
      });
    });

    describe('column header', () => {
      it('uses the localized dimension name from getDimensionTitle as the header', () => {
        mockGetDimensions.mockReturnValue({
          dimensions: [{ id: 'SECTOR', conceptIdentity: 'urn:x' }],
        });
        mockGetDimensionTitle.mockReturnValue('Economic Sector');

        const cols = getCrossDatasetDimensionsColumns(
          makeStructuresMap([[urn, structures]]),
          makeSchemesMap([[urn, makeScheme({ other: ['SECTOR'] })]]),
          LOCALE,
        );

        expect(findCol(cols, 'SECTOR').headerName).toBe('Economic Sector');
      });

      it('falls back to the dimensionId when getDimensionTitle returns undefined', () => {
        mockGetDimensions.mockReturnValue({
          dimensions: [{ id: 'SECTOR', conceptIdentity: 'urn:x' }],
        });
        mockGetDimensionTitle.mockReturnValue(undefined);

        const cols = getCrossDatasetDimensionsColumns(
          makeStructuresMap([[urn, structures]]),
          makeSchemesMap([[urn, makeScheme({ other: ['SECTOR'] })]]),
          LOCALE,
        );

        expect(findCol(cols, 'SECTOR').headerName).toBe('SECTOR');
      });

      it('falls back to the dimensionId when no structure contains the dimension', () => {
        mockGetDimensions.mockReturnValue({ dimensions: [] });

        const cols = getCrossDatasetDimensionsColumns(
          makeStructuresMap([[urn, structures]]),
          makeSchemesMap([[urn, makeScheme({ other: ['UNKNOWN_DIM'] })]]),
          LOCALE,
        );

        expect(findCol(cols, 'UNKNOWN_DIM').headerName).toBe('UNKNOWN_DIM');
      });
    });
  });
});
