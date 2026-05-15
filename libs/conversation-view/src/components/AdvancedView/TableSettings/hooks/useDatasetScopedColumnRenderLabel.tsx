'use client';

import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { getLocalizedName } from '@epam/statgpt-sdmx-toolkit';
import { useTableSettingsContext } from '../TableSettingsContext';
import { useDatasetDimensionsMetadataMapOptional } from '../../../../context/DatasetDimensionsMetadataMapContext';
import { CrossDatasetGridViewMode } from '../types';

/**
 * Builds a `renderLabel` callback for `AgGridColumnsPanel` that decorates
 * dataset-scoped dimension column items with a right-aligned, truncated dataset
 * name. A column is considered dataset-scoped when its dim ID appears in
 * `scheme.other` (always) or in `scheme.indicators` while in extended mode.
 *
 * Returns `undefined` when no dataset-scoped columns exist, so the panel falls
 * back to its default label rendering for all items.
 */
export function useDatasetScopedColumnRenderLabel():
  | ((item: { id: string; label: string }) => ReactNode)
  | undefined {
  const { dataQueries, structuresMap, locale, gridViewMode } =
    useTableSettingsContext();
  const dimensionsCtx = useDatasetDimensionsMetadataMapOptional();

  const datasetScopedColLabels = useMemo(() => {
    const map = new Map<string, string[]>();
    if (!dimensionsCtx || !dataQueries?.length) return map;

    for (const { urn } of dataQueries) {
      const scheme = dimensionsCtx.getDimensionsScheme(urn);
      const hasOther = !!scheme?.other.length;
      const hasIndicators =
        gridViewMode === CrossDatasetGridViewMode.Extended &&
        !!scheme?.indicators?.length;

      if (!hasOther && !hasIndicators) continue;

      const datasetLabel = locale
        ? (getLocalizedName(structuresMap?.get(urn)?.dataflows?.[0], locale) ??
          urn)
        : urn;

      const colIds = [
        ...(scheme?.other ?? []),
        ...(hasIndicators ? (scheme?.indicators ?? []) : []),
      ];

      for (const colId of colIds) {
        const existing = map.get(colId);
        if (existing) {
          existing.push(datasetLabel);
        } else {
          map.set(colId, [datasetLabel]);
        }
      }
    }
    return map;
  }, [dimensionsCtx, dataQueries, structuresMap, locale, gridViewMode]);

  return useMemo(() => {
    if (!datasetScopedColLabels.size) return undefined;

    function renderDatasetScopedColumnLabel(item: {
      id: string;
      label: string;
    }): ReactNode {
      const names = datasetScopedColLabels.get(item.id);

      if (!names?.length) return item.label;

      return (
        <span className="flex w-full items-center gap-2 overflow-hidden">
          <span className="min-w-0 flex-1 truncate" title={item.label}>
            {item.label}
          </span>
          <span
            className="h5 min-w-0 flex-1 truncate text-right text-neutrals-700"
            title={names.join(', ')}
          >
            {names.join(', ')}
          </span>
        </span>
      );
    }

    return renderDatasetScopedColumnLabel;
  }, [datasetScopedColLabels]);
}
