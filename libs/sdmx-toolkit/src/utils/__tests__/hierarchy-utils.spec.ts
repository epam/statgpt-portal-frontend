import type {
  CodelistData,
  Hierarchy,
} from '../../models/structural-metadata/hierarchy';
import type { StructuralData } from '../../models/structural-metadata/structural-metadata';
import type { DataConstraints } from '../../models/structural-metadata/constraints';
import {
  getCodeListsData,
  getHierarchyAvailableCodes,
  getHierarchyCodes,
  resolveCodelistsFromResponse,
  urnMatchesIgnoreVersion,
} from '../hierarchy-utils';

const code = (id: string, name?: string) => ({ id, name });

describe('resolveCodelistsFromResponse', () => {
  it('maps codelists and their codes from SDMX structural data', () => {
    const data: StructuralData = {
      codelists: [
        {
          id: 'CL_FREQ',
          agencyID: 'SDMX',
          version: '1.0',
          name: 'Frequency',
          codes: [
            { id: 'A', name: 'Annual', description: 'Annual frequency' },
            { id: 'Q', name: 'Quarterly' },
          ],
        },
      ],
    };

    expect(resolveCodelistsFromResponse(data)).toEqual([
      {
        id: 'CL_FREQ',
        agencyID: 'SDMX',
        version: '1.0',
        name: 'Frequency',
        codes: [
          { id: 'A', name: 'Annual', description: 'Annual frequency' },
          { id: 'Q', name: 'Quarterly', description: undefined },
        ],
      },
    ]);
  });

  it('uses glossary terms as a fallback when codelists are absent', () => {
    const data: StructuralData = {
      glossaries: [
        {
          id: 'GL_GEO',
          name: 'Geo glossary',
          terms: [
            { id: 'EU', name: 'Europe' },
            { id: 'FR', name: 'France' },
          ],
        },
      ],
    };

    expect(resolveCodelistsFromResponse(data)).toEqual([
      {
        id: 'GL_GEO',
        agencyID: '',
        version: '',
        name: 'Geo glossary',
        codes: [
          { id: 'EU', name: 'Europe', description: undefined },
          { id: 'FR', name: 'France', description: undefined },
        ],
      },
    ]);
  });

  it('returns an empty array when input is undefined', () => {
    expect(resolveCodelistsFromResponse(undefined)).toEqual([]);
  });
});

describe('urnMatchesIgnoreVersion', () => {
  it('returns true when only version parts differ', () => {
    expect(
      urnMatchesIgnoreVersion('SDMX:CL_GEO(1.0)', 'SDMX:CL_GEO(2.1)'),
    ).toBe(true);
  });

  it('returns false when URNs differ by agency or id', () => {
    expect(urnMatchesIgnoreVersion('SDMX:CL_GEO(1.0)', 'ECB:CL_GEO(1.0)')).toBe(
      false,
    );
  });

  it('falls back to strict comparison for malformed URNs without full version brackets', () => {
    expect(urnMatchesIgnoreVersion('SDMX:CL_GEO', 'SDMX:CL_GEO')).toBe(true);
    expect(urnMatchesIgnoreVersion('SDMX:CL_GEO', 'SDMX:CL_FREQ')).toBe(false);
  });
});

describe('getHierarchyCodes', () => {
  const codelists: CodelistData[] = [
    {
      id: 'CL_CONT',
      agencyID: 'SDMX',
      version: '1.0',
      name: 'Continents',
      codes: [code('WORLD', 'World')],
    },
    {
      id: 'CL_GEO',
      agencyID: 'SDMX',
      version: '2.0',
      name: 'Geo',
      codes: [code('EU', 'Europe'), code('FR', 'France')],
    },
  ];

  it('collects hierarchy items recursively and normalizes the URN to the resolved codelist version', () => {
    const hierarchy: Hierarchy = {
      id: 'H_GEO',
      agencyID: 'SDMX',
      version: '1.0',
      name: 'Geo hierarchy',
      hierarchicalCodes: [
        {
          id: 'WORLD',
          code: 'SDMX:CL_CONT(1.0).WORLD',
          hierarchicalCodes: [
            {
              id: 'EU',
              code: 'SDMX:CL_GEO(1.0+).EU',
              hierarchicalCodes: [{ id: 'FR', code: 'SDMX:CL_GEO(1.0+).FR' }],
            },
          ],
        },
      ],
    };

    expect(getHierarchyCodes(hierarchy, codelists)).toEqual([
      { id: 'WORLD', name: 'World', code: 'SDMX:CL_CONT(1.0).WORLD' },
      { id: 'EU', name: 'Europe', code: 'SDMX:CL_GEO(2.0).EU' },
      { id: 'FR', name: 'France', code: 'SDMX:CL_GEO(2.0).FR' },
    ]);
  });

  it('skips missing items but continues collecting nested codes', () => {
    const hierarchy: Hierarchy = {
      id: 'H',
      agencyID: 'SDMX',
      version: '1.0',
      hierarchicalCodes: [
        {
          id: 'U',
          code: 'SDMX:CL_GEO(2.0).UNKNOWN',
          hierarchicalCodes: [{ id: 'FR', code: 'SDMX:CL_GEO(2.0).FR' }],
        },
      ],
    };

    expect(getHierarchyCodes(hierarchy, codelists)).toEqual([
      { id: 'FR', name: 'France', code: 'SDMX:CL_GEO(2.0).FR' },
    ]);
  });

  it('returns an empty array when hierarchy is undefined', () => {
    expect(getHierarchyCodes(undefined, codelists)).toEqual([]);
  });
});

describe('getCodeListsData', () => {
  it('maps codelists by their short URN keys', () => {
    const codelists: CodelistData[] = [
      {
        id: 'CL_GEO',
        agencyID: 'SDMX',
        version: '2.0',
        codes: [code('FR')],
      },
      {
        id: 'GL_GEO',
        agencyID: '',
        version: '',
        codes: [code('EU')],
      },
    ];

    expect(getCodeListsData(codelists)).toEqual({
      'SDMX:CL_GEO(2.0)': [{ id: 'FR', name: undefined }],
      ':GL_GEO': [{ id: 'EU', name: undefined }],
    });
  });

  it('returns an empty object for an empty codelist array', () => {
    expect(getCodeListsData([])).toEqual({});
  });
});

describe('getHierarchyAvailableCodes', () => {
  const codes = [
    code('FR', 'France'),
    code('DE', 'Germany'),
    code('IT', 'Italy'),
  ];

  it('returns original codes when constraints are missing or dimension id is empty', () => {
    expect(getHierarchyAvailableCodes(codes, 'GEO')).toBe(codes);
    expect(getHierarchyAvailableCodes(codes, '', [])).toBe(codes);
  });

  it('returns original codes when there is no included cube region', () => {
    const constraints: DataConstraints[] = [
      {
        id: 'C1',
        agencyID: 'SDMX',
        version: '1.0',
        cubeRegions: [{ isIncluded: false }],
      },
    ];

    expect(getHierarchyAvailableCodes(codes, 'GEO', constraints)).toBe(codes);
  });

  it('returns an empty array when the dimension is not present in member selection', () => {
    const constraints: DataConstraints[] = [
      {
        id: 'C1',
        agencyID: 'SDMX',
        version: '1.0',
        cubeRegions: [
          {
            isIncluded: true,
            memberSelection: [
              {
                included: true,
                componentId: 'FREQ',
                selectionValues: [{ memberValue: 'A' }],
              },
            ],
          },
        ],
      },
    ];

    expect(getHierarchyAvailableCodes(codes, 'GEO', constraints)).toEqual([]);
  });

  it('returns only codes allowed for the selected dimension', () => {
    const constraints: DataConstraints[] = [
      {
        id: 'C1',
        agencyID: 'SDMX',
        version: '1.0',
        cubeRegions: [
          {
            isIncluded: true,
            memberSelection: [
              {
                included: true,
                componentId: 'GEO',
                selectionValues: [{ memberValue: 'DE' }, { memberValue: 'FR' }],
              },
            ],
          },
        ],
      },
    ];

    expect(getHierarchyAvailableCodes(codes, 'GEO', constraints)).toEqual([
      { id: 'FR', name: 'France' },
      { id: 'DE', name: 'Germany' },
    ]);
  });
});
