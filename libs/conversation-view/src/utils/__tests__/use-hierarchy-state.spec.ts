import { act, renderHook, waitFor } from '@testing-library/react';
import type { Filter } from '../../models/filters';
import { useHierarchyState } from '../use-hierarchy-state';

const mockBuildHierarchyFilterTreeProps = jest.fn();
const mockBuildHierarchyUrn = jest.fn();
const mockGetLatestHierarchies = jest.fn();
const mockToggleTreeNodeExpansion = jest.fn();
const mockResolveCodelistsFromResponse = jest.fn();

jest.mock('../hierarchy-view', () => ({
  buildHierarchyFilterTreeProps: (...args: any[]) =>
    mockBuildHierarchyFilterTreeProps(...args),
  buildHierarchyUrn: (...args: any[]) => mockBuildHierarchyUrn(...args),
  getLatestHierarchies: (...args: any[]) => mockGetLatestHierarchies(...args),
  toggleTreeNodeExpansion: (...args: any[]) =>
    mockToggleTreeNodeExpansion(...args),
}));

jest.mock('@epam/statgpt-sdmx-toolkit', () => ({
  resolveCodelistsFromResponse: (...args: any[]) =>
    mockResolveCodelistsFromResponse(...args),
}));

const makeFilter = (overrides: Partial<Filter> = {}): Filter =>
  ({
    id: 'GEO',
    filterType: 'dataset',
    datasetUrn: 'AGENCY:DF(1.0)',
    ...overrides,
  }) as Filter;

const filterKey = 'AGENCY:DF(1.0):GEO';

beforeEach(() => {
  jest.clearAllMocks();
  mockBuildHierarchyFilterTreeProps.mockReturnValue([{ id: 'FR' }]);
  mockBuildHierarchyUrn.mockImplementation(
    (h: any) => `${h.agencyID}:${h.id}(${h.version})`,
  );
  mockGetLatestHierarchies.mockImplementation((items: any[]) => items);
  mockToggleTreeNodeExpansion.mockImplementation((nodes: any[]) => nodes);
  mockResolveCodelistsFromResponse.mockReturnValue([{ id: 'CL_GEO' }]);
});

describe('useHierarchyState', () => {
  it('returns an empty hierarchy state map by default', () => {
    const { result } = renderHook(() =>
      useHierarchyState({
        getCodelistUrnForFilter: () => 'SDMX:CL_GEO(1.0)',
        getConstraintsForFilter: () => [],
      }),
    );

    expect(result.current.hierarchyStateMap.size).toBe(0);
  });

  it('loadAvailableHierarchies stores resolved latest hierarchies and clears loading flag', async () => {
    const getAvailableHierarchies = jest.fn().mockResolvedValue({
      data: {
        hierarchies: [{ id: 'H1' }, { id: 'H2' }],
      },
    });

    const { result } = renderHook(() =>
      useHierarchyState({
        getCodelistUrnForFilter: () => 'SDMX:CL_GEO(1.0)',
        getConstraintsForFilter: () => [],
        getAvailableHierarchies,
      }),
    );

    await act(async () => {
      await result.current.loadAvailableHierarchies(makeFilter());
    });

    expect(getAvailableHierarchies).toHaveBeenCalledWith('SDMX:CL_GEO(1.0)');
    expect(mockGetLatestHierarchies).toHaveBeenCalledWith([
      { id: 'H1' },
      { id: 'H2' },
    ]);
    expect(result.current.hierarchyStateMap.get(filterKey)).toMatchObject({
      availableHierarchies: [{ id: 'H1' }, { id: 'H2' }],
      isLoading: false,
    });
  });

  it('loadAvailableHierarchies sets isLoading back to false when request fails', async () => {
    const getAvailableHierarchies = jest
      .fn()
      .mockRejectedValue(new Error('network error'));

    const { result } = renderHook(() =>
      useHierarchyState({
        getCodelistUrnForFilter: () => 'SDMX:CL_GEO(1.0)',
        getConstraintsForFilter: () => [],
        getAvailableHierarchies,
      }),
    );

    await act(async () => {
      await result.current.loadAvailableHierarchies(makeFilter());
    });

    expect(result.current.hierarchyStateMap.get(filterKey)?.isLoading).toBe(
      false,
    );
  });

  it('loadAvailableHierarchies is a no-op when codelist URN cannot be resolved', async () => {
    const getAvailableHierarchies = jest.fn();
    const { result } = renderHook(() =>
      useHierarchyState({
        getCodelistUrnForFilter: () => undefined,
        getConstraintsForFilter: () => [],
        getAvailableHierarchies,
      }),
    );

    await act(async () => {
      await result.current.loadAvailableHierarchies(makeFilter());
    });

    expect(getAvailableHierarchies).not.toHaveBeenCalled();
    expect(result.current.hierarchyStateMap.size).toBe(0);
  });

  it('onSelectHierarchy resets selected hierarchy and tree when hierarchy is null', async () => {
    const requestedHierarchy = { id: 'H1', agencyID: 'SDMX', version: '1.0' };
    const getHierarchy = jest.fn().mockResolvedValue({
      data: { hierarchies: [requestedHierarchy] },
    });

    const { result } = renderHook(() =>
      useHierarchyState({
        getCodelistUrnForFilter: () => 'SDMX:CL_GEO(1.0)',
        getConstraintsForFilter: () => [],
        getHierarchy,
      }),
    );

    await act(async () => {
      result.current.onSelectHierarchy(makeFilter(), requestedHierarchy as any);
    });
    await waitFor(() =>
      expect(
        result.current.hierarchyStateMap.get(filterKey)?.mainHierarchy,
      ).toEqual(requestedHierarchy),
    );

    act(() => {
      result.current.onSelectHierarchy(makeFilter(), null);
    });

    expect(result.current.hierarchyStateMap.get(filterKey)).toMatchObject({
      selectedHierarchy: null,
      mainHierarchy: null,
      treeNodes: [],
    });
  });

  it('onSelectHierarchy loads hierarchy, resolves codelists and builds tree nodes', async () => {
    const requestedHierarchy = { id: 'H1', agencyID: 'SDMX', version: '1.0' };
    const apiHierarchy = { id: 'H1', agencyID: 'SDMX', version: '1.0' };
    const constraints = [{ id: 'C1' }];
    const getConstraintsForFilter = jest.fn(() => constraints as any);
    const getHierarchy = jest.fn().mockResolvedValue({
      data: {
        hierarchies: [
          apiHierarchy,
          { id: 'H2', agencyID: 'SDMX', version: '1.0' },
        ],
      },
    });

    const { result } = renderHook(() =>
      useHierarchyState({
        getCodelistUrnForFilter: () => 'SDMX:CL_GEO(1.0)',
        getConstraintsForFilter,
        getHierarchy,
      }),
    );

    await act(async () => {
      result.current.onSelectHierarchy(makeFilter(), requestedHierarchy as any);
    });

    await waitFor(() =>
      expect(result.current.hierarchyStateMap.get(filterKey)?.isLoading).toBe(
        false,
      ),
    );

    expect(getHierarchy).toHaveBeenCalledWith('SDMX:H1(1.0)');
    expect(mockResolveCodelistsFromResponse).toHaveBeenCalledWith({
      hierarchies: [
        apiHierarchy,
        { id: 'H2', agencyID: 'SDMX', version: '1.0' },
      ],
    });
    expect(mockBuildHierarchyFilterTreeProps).toHaveBeenCalledWith(
      apiHierarchy,
      [{ id: 'CL_GEO' }],
      'GEO',
      constraints,
      'SDMX:CL_GEO(1.0)',
    );
    expect(result.current.hierarchyStateMap.get(filterKey)).toMatchObject({
      selectedHierarchy: requestedHierarchy,
      mainHierarchy: apiHierarchy,
      codelists: [{ id: 'CL_GEO' }],
      treeNodes: [{ id: 'FR' }],
      isLoading: false,
    });
  });

  it('onSelectHierarchy keeps selected hierarchy but clears mainHierarchy and tree when no exact hierarchy is found', async () => {
    const requestedHierarchy = { id: 'H1', agencyID: 'SDMX', version: '1.0' };
    const getHierarchy = jest.fn().mockResolvedValue({
      data: {
        hierarchies: [{ id: 'H1', agencyID: 'SDMX', version: '2.0' }],
      },
    });

    const { result } = renderHook(() =>
      useHierarchyState({
        getCodelistUrnForFilter: () => 'SDMX:CL_GEO(1.0)',
        getConstraintsForFilter: () => [],
        getHierarchy,
      }),
    );

    await act(async () => {
      result.current.onSelectHierarchy(makeFilter(), requestedHierarchy as any);
    });

    await waitFor(() =>
      expect(result.current.hierarchyStateMap.get(filterKey)?.isLoading).toBe(
        false,
      ),
    );

    expect(result.current.hierarchyStateMap.get(filterKey)).toMatchObject({
      selectedHierarchy: requestedHierarchy,
      mainHierarchy: null,
      treeNodes: [],
      isLoading: false,
    });
    expect(mockResolveCodelistsFromResponse).not.toHaveBeenCalled();
  });

  it('onSelectHierarchy handles getHierarchy failure and resets loading flag', async () => {
    const getHierarchy = jest.fn().mockRejectedValue(new Error('failed'));
    const { result } = renderHook(() =>
      useHierarchyState({
        getCodelistUrnForFilter: () => 'SDMX:CL_GEO(1.0)',
        getConstraintsForFilter: () => [],
        getHierarchy,
      }),
    );

    await act(async () => {
      result.current.onSelectHierarchy(makeFilter(), {
        id: 'H1',
        agencyID: 'SDMX',
        version: '1.0',
      } as any);
    });

    await waitFor(() =>
      expect(result.current.hierarchyStateMap.get(filterKey)?.isLoading).toBe(
        false,
      ),
    );
  });

  it('rebuildHierarchyTree rebuilds tree nodes using explicit constraints when hierarchy is loaded', async () => {
    const requestedHierarchy = { id: 'H1', agencyID: 'SDMX', version: '1.0' };
    const getConstraintsForFilter = jest.fn(() => [{ id: 'fallback' }] as any);
    const getHierarchy = jest.fn().mockResolvedValue({
      data: { hierarchies: [requestedHierarchy] },
    });
    mockBuildHierarchyFilterTreeProps
      .mockReturnValueOnce([{ id: 'INITIAL' }])
      .mockReturnValueOnce([{ id: 'UPDATED' }]);

    const { result } = renderHook(() =>
      useHierarchyState({
        getCodelistUrnForFilter: () => 'SDMX:CL_GEO(1.0)',
        getConstraintsForFilter,
        getHierarchy,
      }),
    );

    await act(async () => {
      result.current.onSelectHierarchy(makeFilter(), requestedHierarchy as any);
    });
    await waitFor(() =>
      expect(
        result.current.hierarchyStateMap.get(filterKey)?.treeNodes,
      ).toEqual([{ id: 'INITIAL' }]),
    );

    const explicitConstraints = [{ id: 'explicit' }] as any;
    const constraintsCallsBeforeRebuild =
      getConstraintsForFilter.mock.calls.length;
    act(() => {
      result.current.rebuildHierarchyTree(makeFilter(), explicitConstraints);
    });

    expect(mockBuildHierarchyFilterTreeProps).toHaveBeenLastCalledWith(
      requestedHierarchy,
      [{ id: 'CL_GEO' }],
      'GEO',
      explicitConstraints,
      'SDMX:CL_GEO(1.0)',
    );
    expect(result.current.hierarchyStateMap.get(filterKey)?.treeNodes).toEqual([
      { id: 'UPDATED' },
    ]);
    expect(getConstraintsForFilter.mock.calls.length).toBe(
      constraintsCallsBeforeRebuild,
    );
  });

  it('onExpandHierarchyNode toggles tree nodes for existing filter key and ignores unknown keys', async () => {
    const requestedHierarchy = { id: 'H1', agencyID: 'SDMX', version: '1.0' };
    const getHierarchy = jest.fn().mockResolvedValue({
      data: { hierarchies: [requestedHierarchy] },
    });
    mockBuildHierarchyFilterTreeProps.mockReturnValue([
      { id: 'EU', isExpanded: false },
    ]);
    mockToggleTreeNodeExpansion.mockReturnValue([
      { id: 'EU', isExpanded: true },
    ]);

    const { result } = renderHook(() =>
      useHierarchyState({
        getCodelistUrnForFilter: () => 'SDMX:CL_GEO(1.0)',
        getConstraintsForFilter: () => [],
        getHierarchy,
      }),
    );

    await act(async () => {
      result.current.onSelectHierarchy(makeFilter(), requestedHierarchy as any);
    });
    await waitFor(() =>
      expect(
        result.current.hierarchyStateMap.get(filterKey)?.treeNodes,
      ).toEqual([{ id: 'EU', isExpanded: false }]),
    );

    act(() => {
      result.current.onExpandHierarchyNode(filterKey, 'EU');
    });
    expect(mockToggleTreeNodeExpansion).toHaveBeenCalledWith(
      [{ id: 'EU', isExpanded: false }],
      'EU',
    );
    expect(result.current.hierarchyStateMap.get(filterKey)?.treeNodes).toEqual([
      { id: 'EU', isExpanded: true },
    ]);

    const before = result.current.hierarchyStateMap;
    act(() => {
      result.current.onExpandHierarchyNode('unknown:key', 'EU');
    });
    expect(result.current.hierarchyStateMap).toBe(before);
  });
});
