'use client';

import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { getLocalizedName } from '@epam/statgpt-sdmx-toolkit';
import { useTableSettingsContext } from '../TableSettingsContext';
import { useDatasetDimensionsMetadataMapOptional } from '../../../../context/DatasetDimensionsMetadataMapContext';

/**
 * Builds a `renderLabel` callback for `AgGridColumnsPanel` that decorates
 * "other" dimension column items with a right-aligned, truncated dataset name.
 *
 * Returns `undefined` when there are no "other" columns, so the panel falls
 * back to its default label rendering for all items.
 */
export function useOtherColumnRenderLabel():
  | ((item: { id: string; label: string }) => ReactNode)
  | undefined {
  const { dataQueries, structuresMap, locale } = useTableSettingsContext();
  const dimensionsCtx = useDatasetDimensionsMetadataMapOptional();

  const otherColDatasetLabels = useMemo(() => {
    const map = new Map<string, string[]>();
    if (!dimensionsCtx || !dataQueries?.length) return map;

    for (const { urn } of dataQueries) {
      const scheme = dimensionsCtx.getDimensionsScheme(urn);
      if (!scheme?.other.length) continue;

      const datasetLabel = locale
        ? (getLocalizedName(structuresMap?.get(urn)?.dataflows?.[0], locale) ??
          urn)
        : urn;

      for (const colId of scheme.other) {
        const existing = map.get(colId);
        if (existing) {
          existing.push(datasetLabel);
        } else {
          map.set(colId, [datasetLabel]);
        }
      }
    }
    return map;
  }, [dimensionsCtx, dataQueries, structuresMap, locale]);

  return useMemo(() => {
    if (!otherColDatasetLabels.size) return undefined;

    function renderOtherColumnLabel(item: {
      id: string;
      label: string;
    }): ReactNode {
      const names = otherColDatasetLabels.get(item.id);

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

    return renderOtherColumnLabel;
  }, [otherColDatasetLabels]);
}
