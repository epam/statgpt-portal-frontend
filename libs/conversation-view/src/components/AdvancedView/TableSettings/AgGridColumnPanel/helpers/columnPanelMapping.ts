import type { ColDef, GridApi } from 'ag-grid-community';
import type { DraggableListNode } from '@epam/statgpt-ui-components';
import type { ColumnPanelFilter } from '../types';

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
