import type { ColDef, GridApi } from 'ag-grid-community';
import type { DraggableListNode } from '@epam/statgpt-ui-components';
import type { ColumnPanelFilter } from '../types';

/**
 * Default predicate that includes a column in the panel when it has a non-empty
 * label and has not been suppressed via `suppressColumnsToolPanel`.
 *
 * @param label - Resolved display label for the column.
 * @param colDef - AG Grid column definition for the column.
 */
export const DEFAULT_INCLUDE_COLUMN: ColumnPanelFilter = ({ label, colDef }) =>
  Boolean(label.trim()) && !colDef.suppressColumnsToolPanel;

/**
 * Returns the stable identifier for a column definition, preferring `colId` over `field`.
 *
 * @param def - AG Grid column definition to extract the identifier from.
 * @returns The column id string, or `null` if neither `colId` nor `field` is set.
 */
export function getColId(def: ColDef): string | null {
  return def.colId ?? def.field ?? null;
}

/**
 * Resolves the human-readable label for a column definition, falling back through
 * `headerName`, `field`, and `colId` in that order.
 *
 * @param def - AG Grid column definition to extract the label from.
 */
export function getColLabel(def: ColDef): string {
  return String(def.headerName ?? def.field ?? def.colId ?? '').trim();
}

/**
 * Builds a map from column id to its current AG Grid column state.
 *
 * @param api - AG Grid API instance used to retrieve the current column state.
 * @returns A `Map` keyed by `colId` with the corresponding column state as the value.
 */
export function buildColumnStateMap(api: GridApi) {
  return new Map(api.getColumnState().map((state) => [state.colId, state]));
}

/**
 * Converts the grid's column definitions into draggable panel items sorted by
 * the current column order, applying the provided filter to exclude columns.
 *
 * @param api - AG Grid API instance used to read column definitions and state.
 * @param includeColumn - Predicate that determines whether a column should appear in the panel.
 */
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

/**
 * Merges a reordered subset of column ids back into the full column order,
 * replacing each included position with the next id from the reordered subset
 * while leaving excluded column positions unchanged.
 *
 * @param fullOrder - The complete list of all column ids in their current order.
 * @param includedOrder - The reordered ids for only the columns that are included in the panel.
 * @param includedSet - A set of column ids that belong to the included subset, used for fast lookup.
 */
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
