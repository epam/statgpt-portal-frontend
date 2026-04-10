import {
  CodelistData,
  DataConstraints,
  Hierarchy,
  StructuralMetaData,
  resolveCodelistsFromResponse,
} from '@epam/statgpt-sdmx-toolkit';
import { useCallback, useState } from 'react';
import { Filter, HierarchyState } from '../models/filters';
import { getFilterIdentity } from './filters';
import {
  buildHierarchyFilterTreeProps,
  buildHierarchyUrn,
  getLatestHierarchies,
  toggleTreeNodeExpansion,
} from './hierarchy-view';

interface UseHierarchyStateOptions {
  getCodelistUrnForFilter: (filter: Filter) => string | undefined;
  getConstraintsForFilter: (filter: Filter) => DataConstraints[] | undefined;
  getAvailableHierarchies?: (
    codelistUrn: string,
  ) => Promise<StructuralMetaData>;
  getHierarchy?: (hierarchyUrn: string) => Promise<StructuralMetaData>;
}

const EMPTY_HIERARCHY_STATE: HierarchyState = {
  availableHierarchies: [],
  selectedHierarchy: null,
  mainHierarchy: null,
  codelists: [],
  treeNodes: [],
  isLoading: false,
};

export const useHierarchyState = ({
  getCodelistUrnForFilter,
  getConstraintsForFilter,
  getAvailableHierarchies,
  getHierarchy,
}: UseHierarchyStateOptions) => {
  const [hierarchyStateMap, setHierarchyStateMap] = useState<
    Map<string, HierarchyState>
  >(new Map());

  const rebuildHierarchyTree = useCallback(
    (filter: Filter, constraints?: DataConstraints[]) => {
      const filterKey = getFilterIdentity(filter);
      if (!filterKey) return;

      const codelistUrn = getCodelistUrnForFilter(filter);
      const currentConstraints = constraints ?? getConstraintsForFilter(filter);

      setHierarchyStateMap((prev) => {
        const state = prev.get(filterKey);
        if (!state?.mainHierarchy) return prev;

        const filterTreeProps = buildHierarchyFilterTreeProps(
          state.mainHierarchy,
          state.codelists,
          filter.id ?? '',
          currentConstraints,
          codelistUrn,
        );

        const next = new Map(prev);
        next.set(filterKey, { ...state, treeNodes: filterTreeProps });
        return next;
      });
    },
    [getCodelistUrnForFilter, getConstraintsForFilter],
  );

  const loadAvailableHierarchies = useCallback(
    async (filter: Filter) => {
      if (!getAvailableHierarchies) return;
      const codelistUrn = getCodelistUrnForFilter(filter);
      if (!codelistUrn) return;

      const filterKey = getFilterIdentity(filter);
      if (!filterKey) return;

      setHierarchyStateMap((prev) => {
        const next = new Map(prev);
        const existing = prev.get(filterKey) ?? EMPTY_HIERARCHY_STATE;
        next.set(filterKey, { ...existing, isLoading: true });
        return next;
      });

      try {
        const response = await getAvailableHierarchies(codelistUrn);
        const availableHierarchies = getLatestHierarchies(
          response?.data?.hierarchies ?? [],
        );
        setHierarchyStateMap((prev) => {
          const next = new Map(prev);
          const existing = prev.get(filterKey) ?? EMPTY_HIERARCHY_STATE;
          next.set(filterKey, {
            ...existing,
            availableHierarchies,
            isLoading: false,
          });
          return next;
        });
      } catch {
        setHierarchyStateMap((prev) => {
          const next = new Map(prev);
          const existing = prev.get(filterKey) ?? EMPTY_HIERARCHY_STATE;
          next.set(filterKey, { ...existing, isLoading: false });
          return next;
        });
      }
    },
    [getAvailableHierarchies, getCodelistUrnForFilter],
  );

  const loadHierarchyTree = useCallback(
    async (filter: Filter, hierarchy: Hierarchy) => {
      if (!getHierarchy) return;
      const filterKey = getFilterIdentity(filter);
      if (!filterKey) return;
      const codelistUrn = getCodelistUrnForFilter(filter);

      setHierarchyStateMap((prev) => {
        const next = new Map(prev);
        const existing = prev.get(filterKey) ?? EMPTY_HIERARCHY_STATE;
        next.set(filterKey, { ...existing, isLoading: true });
        return next;
      });

      try {
        const hierarchyUrn = buildHierarchyUrn(hierarchy);
        const response = await getHierarchy(hierarchyUrn);
        const mainHierarchy = response?.data?.hierarchies?.find(
          (h) => buildHierarchyUrn(h) === hierarchyUrn,
        );

        if (!mainHierarchy) {
          setHierarchyStateMap((prev) => {
            const next = new Map(prev);
            const existing = prev.get(filterKey) ?? EMPTY_HIERARCHY_STATE;
            next.set(filterKey, {
              ...existing,
              selectedHierarchy: hierarchy,
              mainHierarchy: null,
              treeNodes: [],
              isLoading: false,
            });
            return next;
          });
          return;
        }

        const codelists: CodelistData[] = resolveCodelistsFromResponse(
          response?.data,
        );

        const filterTreeProps = buildHierarchyFilterTreeProps(
          mainHierarchy,
          codelists,
          filter.id ?? '',
          getConstraintsForFilter(filter),
          codelistUrn,
        );

        setHierarchyStateMap((prev) => {
          const next = new Map(prev);
          const existing = prev.get(filterKey) ?? EMPTY_HIERARCHY_STATE;
          next.set(filterKey, {
            ...existing,
            selectedHierarchy: hierarchy,
            mainHierarchy,
            codelists,
            treeNodes: filterTreeProps,
            isLoading: false,
          });
          return next;
        });
      } catch {
        setHierarchyStateMap((prev) => {
          const next = new Map(prev);
          const existing = prev.get(filterKey) ?? EMPTY_HIERARCHY_STATE;
          next.set(filterKey, {
            ...existing,
            isLoading: false,
          });
          return next;
        });
      }
    },
    [getHierarchy, getCodelistUrnForFilter, getConstraintsForFilter],
  );

  const onSelectHierarchy = useCallback(
    (filter?: Filter, hierarchy?: Hierarchy | null) => {
      if (!filter) return;
      const filterKey = getFilterIdentity(filter);
      if (!filterKey) return;

      if (!hierarchy) {
        setHierarchyStateMap((prev) => {
          const next = new Map(prev);
          const existing = prev.get(filterKey) ?? EMPTY_HIERARCHY_STATE;
          next.set(filterKey, {
            ...existing,
            selectedHierarchy: null,
            mainHierarchy: null,
            treeNodes: [],
          });
          return next;
        });
        return;
      }

      loadHierarchyTree(filter, hierarchy);
    },
    [loadHierarchyTree],
  );

  const onExpandHierarchyNode = useCallback(
    (filterKey: string, nodeId: string) => {
      setHierarchyStateMap((prev) => {
        const state = prev.get(filterKey);
        if (!state?.treeNodes) return prev;
        const next = new Map(prev);
        next.set(filterKey, {
          ...state,
          treeNodes: toggleTreeNodeExpansion(state.treeNodes, nodeId),
        });
        return next;
      });
    },
    [],
  );

  return {
    hierarchyStateMap,
    rebuildHierarchyTree,
    loadAvailableHierarchies,
    onSelectHierarchy,
    onExpandHierarchyNode,
  };
};
