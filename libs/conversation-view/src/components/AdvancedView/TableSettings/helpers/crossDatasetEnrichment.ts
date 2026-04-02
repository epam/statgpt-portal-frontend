import type {
  DraggableListGroupNode,
  DraggableListItemNode,
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
import type {
  DimensionCustomizationMap,
  DimensionKeyCustomization,
} from '../types';
import { buildDimensionSubItemId } from './dimensionSubItemId';
import {
  COUNTRY_COL_ID,
  FREQUENCY_COL_ID,
  INDICATOR_COL_ID,
} from '../../../../constants/cross-dataset-grid';

/**
 * Column IDs that can be enriched with per-dataset group nodes.
 * Pass a subset as `enrichedColIds` to limit which columns get the grouped sub-items treatment.
 */
export const ALL_AGGREGATED_COL_IDS: ReadonlySet<string> = new Set([
  INDICATOR_COL_ID,
  COUNTRY_COL_ID,
  FREQUENCY_COL_ID,
]);

/**
 * Default set of columns that receive the grouped sub-items treatment.
 * Only the indicator column is enriched by default; country and frequency
 * columns show a flat value without internal dimension breakdown.
 */
export const DEFAULT_ENRICHED_COL_IDS: ReadonlySet<string> = new Set([
  INDICATOR_COL_ID,
]);

interface CrossDatasetColumnsInfo {
  dataQueries: Array<{ urn: string }>;
  structuresMap: Map<string, StructuralData | undefined>;
  getDimensionsScheme: (urn: string) => DatasetDimensionsScheme | undefined;
  getDimensionConfig: (
    urn: string,
    dimKey: string,
  ) => DimensionConfig | undefined;
  locale: string;
  dimensionCustomization?: DimensionCustomizationMap;
  enrichedColIds?: ReadonlySet<string>;
}

/**
 * Applies ordering and hidden-key filtering from a customization record to a list of dimension keys.
 *
 * @param dimensionKeys - The original ordered list of dimension keys for a column.
 * @param custom - Optional customization describing explicit ordering and a set of keys to hide.
 * @returns A reordered and filtered array of dimension keys.
 */
export function applyDimensionKeyCustomization(
  dimensionKeys: string[],
  custom: DimensionKeyCustomization | undefined,
): string[] {
  let result = dimensionKeys;
  if (custom?.order.length) {
    result = [
      ...custom.order.filter((k) => dimensionKeys.includes(k)),
      ...dimensionKeys.filter((k) => !custom.order.includes(k)),
    ];
  }
  if (custom?.hidden.size) {
    result = result.filter((k) => !custom.hidden.has(k));
  }
  return result;
}

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

/**
 * Returns a mapping function that enriches an aggregated draggable list item with
 * per-dataset dimension sub-items and group nodes derived from cross-dataset structural data.
 *
 * @param info - Context containing data queries, structural metadata, dimension scheme resolvers,
 *   locale, and optional dimension customizations used to build child groups.
 * @returns A function that transforms a `DraggableListItemNode`, replacing aggregated column
 *   items with nested group/leaf nodes; non-aggregated items are returned unchanged.
 */
export function buildCrossDatasetEnrichItem(
  info: CrossDatasetColumnsInfo,
): (item: DraggableListItemNode) => DraggableListItemNode {
  const enrichedColIds = info.enrichedColIds ?? DEFAULT_ENRICHED_COL_IDS;

  return (item: DraggableListItemNode) => {
    if (!enrichedColIds.has(item.id)) {
      return item;
    }

    const groups: DraggableListGroupNode[] = [];

    for (const { urn } of info.dataQueries) {
      const baseDimensionKeys = getDimKeysForColId(
        item.id,
        urn,
        info.getDimensionsScheme,
      );
      if (!baseDimensionKeys.length) continue;

      const custom = info.dimensionCustomization?.get(urn)?.get(item.id);
      const orderedDimensionKeys = custom?.order.length
        ? applyDimensionKeyCustomization(baseDimensionKeys, {
            order: custom.order,
            hidden: new Set(),
          })
        : baseDimensionKeys;

      const interactive = orderedDimensionKeys.length > 1;
      const leafItems: DraggableListItemNode[] = orderedDimensionKeys.map(
        (dimensionKey) => ({
          id: buildDimensionSubItemId(urn, dimensionKey),
          type: 'item' as const,
          label: resolveDimLabel(info, urn, dimensionKey),
          isChecked: !custom?.hidden.has(dimensionKey),
          draggable: interactive,
          checkable: interactive,
        }),
      );

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
