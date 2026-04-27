import {
  getCodelistUrnForDatasetFilter,
  getHierarchyRequestContextForFilter,
  getSourceArtefactUrnForDatasetFilter,
} from '../hierarchy-request-context';
import type { Filter } from '../../models/filters';

const mockFindCodelistByDimension = jest.fn<any, any[]>(() => null);
const mockGetKeyFromUrn = jest.fn((urn?: string | null) => {
  if (urn == null) {
    return undefined;
  }

  const separatedValue = urn.split('=');

  return separatedValue.length === 1 ? urn : separatedValue[1];
});

const mockGenerateShortUrn = jest.fn(
  (id?: string, version?: string, agencyId?: string) =>
    `${agencyId}:${id}(${version})`,
);

jest.mock('@epam/statgpt-sdmx-toolkit', () => ({
  findCodelistByDimension: (...args: any[]) =>
    (mockFindCodelistByDimension as any)(...args),
  getKeyFromUrn: (...args: any[]) => (mockGetKeyFromUrn as any)(...args),
  generateShortUrn: (...args: any[]) => (mockGenerateShortUrn as any)(...args),
}));

const DATASET_A_URN = 'AGENCY:DF_A(1.0)';
const DATASET_B_URN = 'AGENCY:DF_B(1.0)';
const FILTER_ID = 'FREQ';

const makeDatasetFilter = (overrides: Partial<Filter> = {}): Filter =>
  ({
    id: FILTER_ID,
    filterType: 'dataset',
    datasetUrn: DATASET_A_URN,
    dimensionValues: [],
    ...overrides,
  }) as Filter;

beforeEach(() => {
  jest.clearAllMocks();
  mockFindCodelistByDimension.mockReturnValue(null);
  mockGetKeyFromUrn.mockImplementation((urn?: string | null) => {
    if (urn == null) {
      return undefined;
    }

    const separatedValue = urn.split('=');

    return separatedValue.length === 1 ? urn : separatedValue[1];
  });
  mockGenerateShortUrn.mockImplementation(
    (id?: string, version?: string, agencyId?: string) =>
      `${agencyId}:${id}(${version})`,
  );
});

describe('getCodelistUrnForDatasetFilter', () => {
  it('returns a normalized codelist URN from localRepresentation.enumeration when it is a full SDMX URN', () => {
    const dimensionsMap = new Map([
      [
        DATASET_A_URN,
        [
          {
            id: FILTER_ID,
            conceptIdentity: 'SDMX:CONCEPTS(1.0).FREQ',
            localRepresentation: {
              enumeration:
                'urn:sdmx:org.sdmx.infomodel.codelist.Codelist=SDMX:CL_FREQ(2.0)',
            },
          },
        ],
      ],
    ]) as any;

    const result = getCodelistUrnForDatasetFilter(
      FILTER_ID,
      DATASET_A_URN,
      dimensionsMap,
    );

    expect(result).toBe('SDMX:CL_FREQ(2.0)');
    expect(mockFindCodelistByDimension).not.toHaveBeenCalled();
  });

  it('returns a normalized codelist URN from codelist.urn when it is a full SDMX URN', () => {
    const dimensionsMap = new Map([
      [
        DATASET_A_URN,
        [{ id: FILTER_ID, conceptIdentity: 'SDMX:CONCEPTS(1.0).FREQ' }],
      ],
    ]) as any;
    const structuresMap = new Map([
      [DATASET_A_URN, { codelists: [], conceptSchemes: [] }],
    ]) as any;

    mockFindCodelistByDimension.mockReturnValue({
      id: 'CL_FREQ',
      version: '2.0',
      agencyID: 'SDMX',
      urn: 'urn:sdmx:org.sdmx.infomodel.codelist.Codelist=SDMX:CL_FREQ(2.0)',
    });

    const result = getCodelistUrnForDatasetFilter(
      FILTER_ID,
      DATASET_A_URN,
      dimensionsMap,
      structuresMap,
    );

    expect(result).toBe('SDMX:CL_FREQ(2.0)');
  });

  it('returns a generated short URN when codelist.urn is missing', () => {
    const dimensionsMap = new Map([
      [
        DATASET_A_URN,
        [{ id: FILTER_ID, conceptIdentity: 'SDMX:CONCEPTS(1.0).FREQ' }],
      ],
    ]) as any;
    const structuresMap = new Map([
      [DATASET_A_URN, { codelists: [], conceptSchemes: [] }],
    ]) as any;

    mockFindCodelistByDimension.mockReturnValue({
      id: 'CL_FREQ',
      version: '2.0',
      agencyID: 'SDMX',
    });

    const result = getCodelistUrnForDatasetFilter(
      FILTER_ID,
      DATASET_A_URN,
      dimensionsMap,
      structuresMap,
    );

    expect(mockGenerateShortUrn).toHaveBeenCalledWith('CL_FREQ', '2.0', 'SDMX');
    expect(result).toBe('SDMX:CL_FREQ(2.0)');
  });
});

describe('getSourceArtefactUrnForDatasetFilter', () => {
  it('returns the matching data structure URN when exactly one data structure contains the filter dimension', () => {
    const structures = {
      dataStructures: [
        {
          id: 'DSD_A',
          agencyID: 'AGENCY',
          version: '1.0',
          urn: 'urn:sdmx:org.sdmx.infomodel.datastructure.DataStructureDefinition=AGENCY:DSD_A(1.0)',
          dataStructureComponents: {
            dimensionList: {
              dimensions: [{ id: FILTER_ID }],
            },
          },
        },
        {
          id: 'DSD_B',
          agencyID: 'AGENCY',
          version: '1.0',
          urn: 'urn:sdmx:org.sdmx.infomodel.datastructure.DataStructureDefinition=AGENCY:DSD_B(1.0)',
          dataStructureComponents: {
            dimensionList: {
              dimensions: [{ id: 'OTHER_DIM' }],
            },
          },
        },
      ],
    } as any;

    const result = getSourceArtefactUrnForDatasetFilter(FILTER_ID, structures);

    expect(result).toBe(
      'urn:sdmx:org.sdmx.infomodel.datastructure.DataStructureDefinition=AGENCY:DSD_A(1.0)',
    );
  });

  it('returns a generated short URN when the matching data structure has no URN', () => {
    const structures = {
      dataStructures: [
        {
          id: 'DSD_A',
          agencyID: 'AGENCY',
          version: '1.0',
          dataStructureComponents: {
            dimensionList: {
              dimensions: [{ id: FILTER_ID }],
            },
          },
        },
      ],
    } as any;

    const result = getSourceArtefactUrnForDatasetFilter(FILTER_ID, structures);

    expect(mockGenerateShortUrn).toHaveBeenCalledWith('DSD_A', '1.0', 'AGENCY');
    expect(result).toBe('AGENCY:DSD_A(1.0)');
  });

  it('returns undefined when multiple matching data structures resolve to different URNs', () => {
    const structures = {
      dataStructures: [
        {
          id: 'DSD_A',
          agencyID: 'AGENCY',
          version: '1.0',
          urn: 'AGENCY:DSD_A(1.0)',
          dataStructureComponents: {
            dimensionList: {
              dimensions: [{ id: FILTER_ID }],
            },
          },
        },
        {
          id: 'DSD_B',
          agencyID: 'AGENCY',
          version: '1.0',
          urn: 'AGENCY:DSD_B(1.0)',
          dataStructureComponents: {
            dimensionList: {
              dimensions: [{ id: FILTER_ID }],
            },
          },
        },
      ],
    } as any;

    const result = getSourceArtefactUrnForDatasetFilter(FILTER_ID, structures);

    expect(result).toBeUndefined();
  });
});

describe('getHierarchyRequestContextForFilter', () => {
  it('returns a shared hierarchy request context when all source datasets resolve to the same codelist and source artefact', () => {
    const filter: Filter = {
      id: FILTER_ID,
      filterType: 'shared',
      sourceDatasetUrns: [DATASET_A_URN, DATASET_B_URN],
      dimensionValues: [],
    };
    const dimensionsMap = new Map([
      [
        DATASET_A_URN,
        [
          {
            id: FILTER_ID,
            localRepresentation: {
              enumeration:
                'urn:sdmx:org.sdmx.infomodel.codelist.Codelist=SDMX:CL_FREQ(2.0)',
            },
          },
        ],
      ],
      [
        DATASET_B_URN,
        [
          {
            id: FILTER_ID,
            localRepresentation: {
              enumeration: 'SDMX:CL_FREQ(2.0)',
            },
          },
        ],
      ],
    ]) as any;
    const structuresMap = new Map([
      [
        DATASET_A_URN,
        {
          dataStructures: [
            {
              id: 'DSD_A',
              agencyID: 'AGENCY',
              version: '1.0',
              urn: 'AGENCY:DSD_A(1.0)',
              dataStructureComponents: {
                dimensionList: {
                  dimensions: [{ id: FILTER_ID }],
                },
              },
            },
          ],
        },
      ],
      [
        DATASET_B_URN,
        {
          dataStructures: [
            {
              id: 'DSD_A',
              agencyID: 'AGENCY',
              version: '1.0',
              urn: 'AGENCY:DSD_A(1.0)',
              dataStructureComponents: {
                dimensionList: {
                  dimensions: [{ id: FILTER_ID }],
                },
              },
            },
          ],
        },
      ],
    ]) as any;

    const result = getHierarchyRequestContextForFilter(
      filter,
      dimensionsMap,
      structuresMap,
    );

    expect(result).toEqual({
      codelistUrn: 'SDMX:CL_FREQ(2.0)',
      sourceArtefactUrn: 'AGENCY:DSD_A(1.0)',
    });
  });

  it('returns undefined context fields when source datasets resolve inconsistently', () => {
    const filter: Filter = {
      id: FILTER_ID,
      filterType: 'shared',
      sourceDatasetUrns: [DATASET_A_URN, DATASET_B_URN],
      dimensionValues: [],
    };
    const dimensionsMap = new Map([
      [
        DATASET_A_URN,
        [
          {
            id: FILTER_ID,
            localRepresentation: {
              enumeration: 'SDMX:CL_FREQ(2.0)',
            },
          },
        ],
      ],
      [
        DATASET_B_URN,
        [
          {
            id: FILTER_ID,
            localRepresentation: {
              enumeration: 'SDMX:CL_AREA(1.0)',
            },
          },
        ],
      ],
    ]) as any;
    const structuresMap = new Map([
      [
        DATASET_A_URN,
        {
          dataStructures: [
            {
              id: 'DSD_A',
              agencyID: 'AGENCY',
              version: '1.0',
              urn: 'AGENCY:DSD_A(1.0)',
              dataStructureComponents: {
                dimensionList: {
                  dimensions: [{ id: FILTER_ID }],
                },
              },
            },
          ],
        },
      ],
      [
        DATASET_B_URN,
        {
          dataStructures: [
            {
              id: 'DSD_B',
              agencyID: 'AGENCY',
              version: '1.0',
              urn: 'AGENCY:DSD_B(1.0)',
              dataStructureComponents: {
                dimensionList: {
                  dimensions: [{ id: FILTER_ID }],
                },
              },
            },
          ],
        },
      ],
    ]) as any;

    const result = getHierarchyRequestContextForFilter(
      filter,
      dimensionsMap,
      structuresMap,
    );

    expect(result).toEqual({
      codelistUrn: undefined,
      sourceArtefactUrn: undefined,
    });
  });

  it('returns a dataset-specific hierarchy request context for a dataset filter', () => {
    const filter = makeDatasetFilter();
    const dimensionsMap = new Map([
      [
        DATASET_A_URN,
        [
          {
            id: FILTER_ID,
            localRepresentation: {
              enumeration: 'SDMX:CL_FREQ(2.0)',
            },
          },
        ],
      ],
    ]) as any;
    const structuresMap = new Map([
      [
        DATASET_A_URN,
        {
          dataStructures: [
            {
              id: 'DSD_A',
              agencyID: 'AGENCY',
              version: '1.0',
              urn: 'AGENCY:DSD_A(1.0)',
              dataStructureComponents: {
                dimensionList: {
                  dimensions: [{ id: FILTER_ID }],
                },
              },
            },
          ],
        },
      ],
    ]) as any;

    const result = getHierarchyRequestContextForFilter(
      filter,
      dimensionsMap,
      structuresMap,
    );

    expect(result).toEqual({
      codelistUrn: 'SDMX:CL_FREQ(2.0)',
      sourceArtefactUrn: 'AGENCY:DSD_A(1.0)',
    });
  });
});
