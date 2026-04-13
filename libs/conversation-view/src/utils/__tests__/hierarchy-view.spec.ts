import type {
  CodelistData,
  DataConstraints,
  Hierarchy,
  TreeNode,
  HierarchicalCode,
} from '@epam/statgpt-sdmx-toolkit';
import type { FilterTreeNodeProps } from '../../models/filters';

const mockGenerateShortUrn = jest.fn(
  (id?: string, version?: string, agency?: string) =>
    `${agency ?? ''}:${id ?? ''}${version ? `(${version})` : ''}`,
);

const mockGetChildParsedUrn = jest.fn((childUrn: string) => {
  const [urnPart, childId = ''] = childUrn.split(').');
  const normalizedUrn = urnPart.endsWith(')') ? urnPart : `${urnPart})`;
  const match = normalizedUrn.match(/^([^:]*):([^(]+)(?:\(([^)]*)\))?$/);
  return {
    agency: match?.[1] ?? '',
    id: match?.[2] ?? '',
    version: match?.[3] ?? '',
    childId,
  };
});

const mockUrnMatchesIgnoreVersion = jest.fn((urnA: string, urnB: string) => {
  const normalize = (u: string): string => {
    const start = u.indexOf('(');
    if (start === -1) return u;
    const end = u.indexOf(')', start);
    if (end === -1) return u;
    return u.slice(0, start + 1) + '*' + u.slice(end);
  };
  return normalize(urnA) === normalize(urnB);
});

const mockGetCodeListsData = jest.fn((codelists: CodelistData[]) => {
  const map: Record<string, any[]> = {};
  codelists?.forEach((codelist) => {
    map[
      mockGenerateShortUrn(
        codelist.id,
        codelist.version ?? '',
        codelist.agencyID ?? '',
      )
    ] = codelist.codes as any[];
  });
  return map;
});

const mockGetHierarchyCodes = jest.fn(
  (hierarchy?: Hierarchy, codelists?: CodelistData[]) => {
    const result: any[] = [];

    const collect = (codes?: any[]) => {
      codes?.forEach((hCode) => {
        const { childId, agency, id, version } = mockGetChildParsedUrn(
          hCode.code,
        );
        const parentShortUrn = mockGenerateShortUrn(id, version, agency);
        const codelist = codelists?.find((c) =>
          mockUrnMatchesIgnoreVersion(
            parentShortUrn,
            mockGenerateShortUrn(c.id, c.version ?? '', c.agencyID ?? ''),
          ),
        );
        const item = codelist?.codes?.find((c) => c.id === childId);

        if (item) {
          result.push({ ...item, code: hCode.code });
        }

        collect(hCode.hierarchicalCodes);
      });
    };

    collect(hierarchy?.hierarchicalCodes);
    return result;
  },
);

const mockGetHierarchyAvailableCodes = jest.fn(
  (
    codes: any[],
    dimensionId: string,
    constraints?: DataConstraints[],
  ): any[] => {
    if (!constraints || constraints.length === 0 || !dimensionId) return codes;
    const cubeRegion = constraints[0].cubeRegions?.find((r) => r.isIncluded);
    if (!cubeRegion) return codes;
    const keyValues = cubeRegion.memberSelection?.find(
      (m) => m.componentId === dimensionId,
    );
    if (!keyValues) return [];
    const validIds = new Set(
      keyValues.selectionValues.map((v: any) => v.memberValue),
    );
    return codes.filter((c) => validIds.has(c.id));
  },
);

jest.mock('@epam/statgpt-sdmx-toolkit', () => ({
  generateShortUrn: (id?: string, version?: string, agency?: string) =>
    mockGenerateShortUrn(id, version, agency),
  getChildParsedUrn: (childUrn: string) => mockGetChildParsedUrn(childUrn),
  urnMatchesIgnoreVersion: (urnA: string, urnB: string) =>
    mockUrnMatchesIgnoreVersion(urnA, urnB),
  getCodeListsData: (codelists: CodelistData[]) =>
    mockGetCodeListsData(codelists),
  getHierarchyCodes: (hierarchy?: Hierarchy, codelists?: CodelistData[]) =>
    mockGetHierarchyCodes(hierarchy, codelists),
  getHierarchyAvailableCodes: (
    codes: any[],
    dimensionId: string,
    constraints?: DataConstraints[],
  ) => mockGetHierarchyAvailableCodes(codes, dimensionId, constraints),
}));

import {
  applySelectionToTree,
  buildHierarchyFilterTreeProps,
  buildHierarchyUrn,
  filterHierarchyNodes,
  getLatestHierarchies,
  hierarchyNodesToFilterTreeProps,
  toggleTreeNodeExpansion,
} from '../hierarchy-view';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getLatestHierarchies', () => {
  it('keeps only the latest version per "agency:id" group', () => {
    const hierarchies: Hierarchy[] = [
      { agencyID: 'ECB', id: 'H_GEO', version: '1.0' } as Hierarchy,
      { agencyID: 'ECB', id: 'H_GEO', version: '1.2' } as Hierarchy,
      { agencyID: 'IMF', id: 'H_GEO', version: '1.1' } as Hierarchy,
      { agencyID: 'ECB', id: 'H_FREQ', version: '2.0' } as Hierarchy,
    ];

    expect(getLatestHierarchies(hierarchies)).toEqual([
      { agencyID: 'ECB', id: 'H_GEO', version: '1.2' },
      { agencyID: 'IMF', id: 'H_GEO', version: '1.1' },
      { agencyID: 'ECB', id: 'H_FREQ', version: '2.0' },
    ]);
  });
});

describe('buildHierarchyUrn', () => {
  it('builds URN with version when version is provided', () => {
    expect(
      buildHierarchyUrn({
        agencyID: 'ECB',
        id: 'H_GEO',
        version: '1.0',
      } as Hierarchy),
    ).toBe('ECB:H_GEO(1.0)');
  });

  it('builds URN without brackets when version is empty', () => {
    expect(
      buildHierarchyUrn({
        agencyID: 'ECB',
        id: 'H_GEO',
      } as Hierarchy),
    ).toBe('ECB:H_GEO');
  });
});

describe('buildHierarchyFilterTreeProps', () => {
  const codelists: CodelistData[] = [
    {
      id: 'CL_CONT',
      agencyID: 'SDMX',
      version: '1.0',
      codes: [{ id: 'WORLD', name: 'World' }],
    },
    {
      id: 'CL_GEO',
      agencyID: 'SDMX',
      version: '1.0',
      codes: [
        { id: 'EU', name: 'Europe' },
        { id: 'FR', name: 'France' },
        { id: 'DE', name: 'Germany' },
      ],
    },
  ];

  it('builds hierarchy tree and keeps structural parent nodes with non-disabled descendants', () => {
    const hierarchy: Hierarchy = {
      id: 'H_GEO',
      agencyID: 'SDMX',
      version: '1.0',
      hierarchicalCodes: [
        {
          id: 'WORLD',
          code: 'SDMX:CL_CONT(1.0).WORLD',
          hierarchicalCodes: [
            {
              id: 'EU',
              code: 'SDMX:CL_GEO(1.0).EU',
              hierarchicalCodes: [
                { id: 'FR', code: 'SDMX:CL_GEO(1.0).FR' },
                { id: 'DE', code: 'SDMX:CL_GEO(1.0).DE' },
              ],
            },
          ],
        },
      ],
    };

    expect(
      buildHierarchyFilterTreeProps(
        hierarchy,
        codelists,
        'GEO',
        undefined,
        'SDMX:CL_GEO(1.0)',
      ),
    ).toEqual([
      {
        id: 'WORLD',
        name: 'World',
        isExpanded: true,
        isSelectedValue: false,
        disabled: false,
        children: [
          {
            id: 'EU',
            name: 'Europe',
            isExpanded: true,
            isSelectedValue: false,
            disabled: false,
            children: [
              {
                id: 'FR',
                name: 'France',
                isExpanded: true,
                isSelectedValue: false,
                disabled: false,
                children: [],
              },
              {
                id: 'DE',
                name: 'Germany',
                isExpanded: true,
                isSelectedValue: false,
                disabled: false,
                children: [],
              },
            ],
          },
        ],
      },
    ]);
  });

  it('filters leaf codes by constraints for the selected dimension', () => {
    const hierarchy: Hierarchy = {
      id: 'H_GEO',
      agencyID: 'SDMX',
      version: '1.0',
      hierarchicalCodes: [
        {
          id: 'WORLD',
          code: 'SDMX:CL_CONT(1.0).WORLD',
          hierarchicalCodes: [
            {
              id: 'EU',
              code: 'SDMX:CL_GEO(1.0).EU',
              hierarchicalCodes: [
                { id: 'FR', code: 'SDMX:CL_GEO(1.0).FR' },
                { id: 'DE', code: 'SDMX:CL_GEO(1.0).DE' },
              ],
            },
          ],
        },
      ],
    };

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
                selectionValues: [{ memberValue: 'FR' }],
              },
            ],
          },
        ],
      },
    ];

    expect(
      buildHierarchyFilterTreeProps(
        hierarchy,
        codelists,
        'GEO',
        constraints,
        'SDMX:CL_GEO(1.0)',
      ),
    ).toEqual([
      {
        id: 'WORLD',
        name: 'World',
        isExpanded: true,
        isSelectedValue: false,
        disabled: false,
        children: [
          {
            id: 'EU',
            name: 'Europe',
            isExpanded: true,
            isSelectedValue: false,
            disabled: false,
            children: [
              {
                id: 'FR',
                name: 'France',
                isExpanded: true,
                isSelectedValue: false,
                disabled: false,
                children: [],
              },
            ],
          },
        ],
      },
    ]);
  });

  it('drops structural nodes when all their descendants are filtered out', () => {
    const hierarchy: Hierarchy = {
      id: 'H_GEO',
      agencyID: 'SDMX',
      version: '1.0',
      hierarchicalCodes: [
        {
          id: 'WORLD',
          code: 'SDMX:CL_CONT(1.0).WORLD',
          hierarchicalCodes: [{ id: 'FR', code: 'SDMX:CL_GEO(1.0).FR' }],
        },
      ],
    };
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
                selectionValues: [{ memberValue: 'WORLD' }],
              },
            ],
          },
        ],
      },
    ];

    expect(
      buildHierarchyFilterTreeProps(
        hierarchy,
        codelists,
        'GEO',
        constraints,
        'SDMX:CL_GEO(1.0)',
      ),
    ).toEqual([]);
  });
});

describe('hierarchyNodesToFilterTreeProps', () => {
  it('maps hierarchy nodes to filter tree nodes recursively', () => {
    const nodes: TreeNode<HierarchicalCode>[] = [
      {
        id: 'SDMX:CL_GEO(1.0).EU',
        name: 'Europe',
        children: [
          {
            id: 'SDMX:CL_GEO(1.0).FR',
            name: 'France',
            children: [],
            metadata: { id: 'FR', code: 'SDMX:CL_GEO(1.0).FR' },
          },
        ],
        metadata: { id: 'EU', code: 'SDMX:CL_GEO(1.0).EU' },
      },
    ];

    expect(hierarchyNodesToFilterTreeProps(nodes)).toEqual([
      {
        id: 'EU',
        name: 'Europe',
        isExpanded: undefined,
        isSelectedValue: false,
        disabled: undefined,
        children: [
          {
            id: 'FR',
            name: 'France',
            isExpanded: undefined,
            isSelectedValue: false,
            disabled: undefined,
            children: [],
          },
        ],
      },
    ]);
  });
});

describe('applySelectionToTree', () => {
  it('marks selected nodes recursively using selected id set', () => {
    const nodes: FilterTreeNodeProps[] = [
      {
        id: 'EU',
        children: [
          { id: 'FR', children: [] },
          { id: 'DE', children: [] },
        ],
      },
    ];

    expect(applySelectionToTree(nodes, new Set(['EU', 'DE']))).toEqual([
      {
        id: 'EU',
        isSelectedValue: true,
        children: [
          { id: 'FR', isSelectedValue: false, children: [] },
          { id: 'DE', isSelectedValue: true, children: [] },
        ],
      },
    ]);
  });
});

describe('toggleTreeNodeExpansion', () => {
  it('toggles only the requested node and keeps other nodes unchanged', () => {
    const nodes: FilterTreeNodeProps[] = [
      {
        id: 'EU',
        isExpanded: false,
        children: [{ id: 'FR', isExpanded: false, children: [] }],
      },
      { id: 'ASIA', isExpanded: true, children: [] },
    ];

    expect(toggleTreeNodeExpansion(nodes, 'FR')).toEqual([
      {
        id: 'EU',
        isExpanded: false,
        children: [{ id: 'FR', isExpanded: true, children: [] }],
      },
      { id: 'ASIA', isExpanded: true, children: [] },
    ]);
  });
});

describe('filterHierarchyNodes', () => {
  const tree: FilterTreeNodeProps[] = [
    {
      id: 'WORLD',
      name: 'World',
      isExpanded: false,
      children: [
        {
          id: 'EU',
          name: 'Europe',
          isExpanded: false,
          children: [
            { id: 'FR', name: 'France', isExpanded: false, children: [] },
          ],
        },
        {
          id: 'AS',
          name: 'Asia',
          isExpanded: false,
          children: [
            { id: 'JP', name: 'Japan', isExpanded: false, children: [] },
          ],
        },
      ],
    },
  ];

  it('keeps full subtree when parent node matches search text', () => {
    expect(filterHierarchyNodes(tree, 'world')).toEqual([
      {
        id: 'WORLD',
        name: 'World',
        isExpanded: true,
        children: tree[0].children,
      },
    ]);
  });

  it('keeps only matching branches when only descendants match search text', () => {
    expect(filterHierarchyNodes(tree, 'fra')).toEqual([
      {
        id: 'WORLD',
        name: 'World',
        isExpanded: true,
        children: [
          {
            id: 'EU',
            name: 'Europe',
            isExpanded: true,
            children: [
              { id: 'FR', name: 'France', isExpanded: true, children: [] },
            ],
          },
        ],
      },
    ]);
  });

  it('returns an empty array when nothing matches', () => {
    expect(filterHierarchyNodes(tree, 'oceania')).toEqual([]);
  });
});
