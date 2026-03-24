import type { ColDef, GridApi } from 'ag-grid-community';
import type {
  DraggableListGroupNode,
  DraggableListItemNode,
  DraggableListNode,
} from '@epam/statgpt-ui-components';
import type {
  DatasetDimensionsScheme,
  DimensionConfig,
  StructuralData,
} from '@epam/statgpt-sdmx-toolkit';
import {
  getDimensionTitle,
  getDimensions,
  getLocalizedName,
} from '@epam/statgpt-sdmx-toolkit';
import type { AgGridInitialColumnsState, ColumnPanelFilter } from './types';
import {
  COUNTRY_COL_ID,
  FREQUENCY_COL_ID,
  INDICATOR_COL_ID,
} from '../../../../constants/cross-dataset-grid';

export const DEFAULT_INCLUDE_COLUMN: ColumnPanelFilter = ({ label, colDef }) =>
  Boolean(label.trim()) && !colDef.suppressColumnsToolPanel;

export function getColId(def: ColDef): string | null {
  return def.colId ?? def.field ?? null;
}

export function getColLabel(def: ColDef): string {
  return String(def.headerName ?? def.field ?? def.colId ?? '').trim();
}

export function buildColumnStateMap(api: GridApi) {
  return new Map(api.getColumnState().map((state) => [state.colId, state]));
}

export function mapColumnsToPanelItems(
  api: GridApi,
  includeColumn: ColumnPanelFilter,
): DraggableListNode[] {
  const columnDefs = (api.getColumnDefs() ?? []) as ColDef[];
  const stateMap = buildColumnStateMap(api);

  const items: DraggableListNode[] = [];

  for (const def of columnDefs) {
    const colId = getColId(def);

    if (!colId) {
      continue;
    }

    const label = getColLabel(def);

    if (!includeColumn({ colId, label, colDef: def })) {
      continue;
    }

    const state = stateMap.get(colId);

    items.push({
      id: colId,
      type: 'item',
      label,
      isChecked: !(state?.hide ?? false),
      draggable: true,
      checkable: true,
    });
  }

  const currentOrder = api.getColumnState().map((state) => state.colId);
  const orderMap = new Map(currentOrder.map((colId, index) => [colId, index]));

  return items.sort((a, b) => {
    const aIndex = orderMap.get(a.id) ?? Number.MAX_SAFE_INTEGER;
    const bIndex = orderMap.get(b.id) ?? Number.MAX_SAFE_INTEGER;

    return aIndex - bIndex;
  });
}

export function getItemNodeByPath(
  nodes: DraggableListNode[],
  path: readonly string[],
): DraggableListItemNode | undefined {
  let currentNodes = nodes;
  let current: DraggableListNode | undefined;

  for (const id of path) {
    current = currentNodes.find((node) => node.id === id);

    if (!current) {
      return undefined;
    }

    currentNodes =
      current.type === 'group' ? current.items : (current.items ?? []);
  }

  return current?.type === 'item' ? current : undefined;
}

export function flattenIncludedLeafIds(
  nodes: DraggableListNode[],
  isLeaf?: (node: DraggableListItemNode) => boolean,
): string[] {
  const result: string[] = [];

  for (const node of nodes) {
    if (node.type === 'group') {
      result.push(...flattenIncludedLeafIds(node.items, isLeaf));
      continue;
    }

    if (isLeaf?.(node)) {
      result.push(node.id);
      continue;
    }

    if (node.items?.length) {
      result.push(...flattenIncludedLeafIds(node.items, isLeaf));
      continue;
    }

    result.push(node.id);
  }

  return result;
}

export interface CrossDatasetColumnsInfo {
  dataQueries: Array<{ urn: string }>;
  structuresMap: Map<string, StructuralData | undefined>;
  getDimensionsScheme: (urn: string) => DatasetDimensionsScheme | undefined;
  getDimensionConfig: (
    urn: string,
    dimKey: string,
  ) => DimensionConfig | undefined;
  locale: string;
}

const AGGREGATED_COL_IDS = new Set([
  INDICATOR_COL_ID,
  COUNTRY_COL_ID,
  FREQUENCY_COL_ID,
]);

function getDimKeysForColId(
  colId: string,
  urn: string,
  getDimensionsScheme: (urn: string) => DatasetDimensionsScheme | undefined,
): string[] {
  const scheme = getDimensionsScheme(urn);

  if (!scheme) return [];
  if (colId === INDICATOR_COL_ID) return scheme.indicators;
  if (colId === COUNTRY_COL_ID) return scheme.region ? [scheme.region] : [];
  if (colId === FREQUENCY_COL_ID)
    return scheme.frequency ? [scheme.frequency] : [];

  return [];
}

function resolveDimLabel(
  info: CrossDatasetColumnsInfo,
  urn: string,
  dimKey: string,
): string {
  const config = info.getDimensionConfig(urn, dimKey);
  if (config?.alias) return config.alias;

  const structures = info.structuresMap.get(urn);
  const dimensions = structures
    ? (getDimensions(structures)?.dimensions ?? [])
    : [];
  const dimension = dimensions.find((d) => d.id === dimKey);

  return (
    getDimensionTitle(
      structures?.conceptSchemes ?? [],
      dimension,
      info.locale,
    ) ?? dimKey
  );
}

export function buildCrossDatasetEnrichItem(
  info: CrossDatasetColumnsInfo,
): (item: DraggableListItemNode) => DraggableListItemNode {
  return (item: DraggableListItemNode) => {
    if (!AGGREGATED_COL_IDS.has(item.id)) {
      return item;
    }

    const groups: DraggableListGroupNode[] = [];

    for (const { urn } of info.dataQueries) {
      const dimKeys = getDimKeysForColId(
        item.id,
        urn,
        info.getDimensionsScheme,
      );
      if (!dimKeys.length) continue;

      const leafItems: DraggableListItemNode[] = dimKeys.map((dimKey) => ({
        id: `${urn}::${dimKey}`,
        type: 'item' as const,
        label: resolveDimLabel(info, urn, dimKey),
        isChecked: true,
        draggable: false,
        checkable: false,
      }));

      const structuralData = info.structuresMap.get(urn);
      const groupLabel =
        getLocalizedName(structuralData?.dataflows?.[0], info.locale) ?? urn;

      groups.push({
        id: urn,
        type: 'group' as const,
        label: groupLabel,
        items: leafItems,
      });
    }

    if (!groups.length) {
      return item;
    }

    return { ...item, items: groups };
  };
}

export function mergeIncludedOrderIntoFullOrder(
  fullOrder: string[],
  includedOrder: string[],
  includedSet: Set<string>,
): string[] {
  const includedQueue = [...includedOrder];

  return fullOrder.map((colId) => {
    if (!includedSet.has(colId)) {
      return colId;
    }

    return includedQueue.shift() ?? colId;
  });
}

export function captureInitialColumnsState(
  api: GridApi,
): AgGridInitialColumnsState {
  return {
    columnState: api.getColumnState(),
    columnGroupState: api.getColumnGroupState(),
  };
}

export function restoreInitialColumnsState(
  api: GridApi,
  initialState?: AgGridInitialColumnsState | null,
) {
  if (!initialState) {
    return;
  }

  api.applyColumnState({
    state: initialState.columnState,
    applyOrder: true,
  });

  api.setColumnGroupState(initialState.columnGroupState);
}
