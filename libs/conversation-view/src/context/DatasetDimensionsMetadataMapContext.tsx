'use client';

import React, { createContext, ReactNode, useContext, useMemo } from 'react';
import {
  Dataflow,
  DatasetDimensionsScheme,
  DatasetLastUpdatedMap,
  DimensionConfig,
  DimensionKey,
  generateShortUrn,
  getLastUpdatedTime,
  ShortUrn,
  DatasetDimensionsMetadataMap,
} from '@epam/statgpt-sdmx-toolkit';

type GetDimensionMetadata = (
  urn: ShortUrn,
  dimensionKey: DimensionKey,
) => DimensionConfig | undefined;

type GetDatasetLastUpdated = (
  dataset: Dataflow | null | undefined,
) => string | undefined;

interface DatasetDimensionsMetadataMapContextValue {
  map: DatasetDimensionsMetadataMap;
  getDimensionsMetadata: (
    urn: ShortUrn,
  ) => Record<DimensionKey, DimensionConfig> | undefined;
  getDimensionMetadata: GetDimensionMetadata;
  getRegionDimension: (urn: ShortUrn) => DimensionKey | undefined;
  getFrequencyDimension: (urn: ShortUrn) => DimensionKey | undefined;
  getIndicatorDimensions: (urn: ShortUrn) => DimensionKey[];
  getDimensionsScheme: (urn: ShortUrn) => DatasetDimensionsScheme | undefined;
  getDatasetLastUpdated: GetDatasetLastUpdated;
}

const EMPTY_DATASET_DIMENSIONS_METADATA_MAP =
  {} as DatasetDimensionsMetadataMap;

const EMPTY_DATASET_LAST_UPDATED_MAP = {} as DatasetLastUpdatedMap;

const DEFAULT_CONTEXT_VALUE: DatasetDimensionsMetadataMapContextValue = {
  map: EMPTY_DATASET_DIMENSIONS_METADATA_MAP,
  getDimensionsMetadata: () => undefined,
  getDimensionMetadata: () => undefined,
  getRegionDimension: () => undefined,
  getFrequencyDimension: () => undefined,
  getIndicatorDimensions: () => [],
  getDimensionsScheme: () => undefined,
  getDatasetLastUpdated: (dataset) => getLastUpdatedTime(dataset),
};

const Context = createContext<DatasetDimensionsMetadataMapContextValue>(
  DEFAULT_CONTEXT_VALUE,
);

export function DatasetDimensionsMetadataMapProvider({
  map,
  lastUpdatedMap = EMPTY_DATASET_LAST_UPDATED_MAP,
  children,
}: {
  map: DatasetDimensionsMetadataMap;
  lastUpdatedMap?: DatasetLastUpdatedMap;
  children: ReactNode;
}) {
  const value = useMemo<DatasetDimensionsMetadataMapContextValue>(() => {
    const dimensionsBySubtype: Record<
      ShortUrn,
      Record<string, DimensionKey>
    > = {};
    const dimensionsByType: Record<
      ShortUrn,
      Record<string, DimensionKey[]>
    > = {};
    const schemesCache: Record<ShortUrn, DatasetDimensionsScheme> = {};
    const urns = Object.keys(map);

    for (const urn of urns) {
      dimensionsBySubtype[urn] = {};
      dimensionsByType[urn] = {};
      const dimensions = Object.keys(map[urn]);

      for (const dimensionKey of dimensions) {
        const dim = map[urn][dimensionKey];
        if (dim.subtype) {
          dimensionsBySubtype[urn][dim.subtype] = dimensionKey;
        }
        if (!dimensionsByType[urn][dim.dimensionType]) {
          dimensionsByType[urn][dim.dimensionType] = [];
        }
        dimensionsByType[urn][dim.dimensionType].push(dimensionKey);
      }

      schemesCache[urn] = {
        timePeriod: dimensionsByType[urn]?.['TIME_PERIOD']?.[0] ?? void 0,
        frequency: dimensionsBySubtype[urn]?.['FREQUENCY'] ?? void 0,
        region: dimensionsBySubtype[urn]?.['REGION'] ?? void 0,
        indicators: dimensionsByType[urn]?.['INDICATOR'] ?? [],
        other: (dimensionsByType[urn]?.['NON_INDICATOR'] ?? []).filter(
          (key) => {
            const dim = map[urn][key];
            return dim.subtype !== 'FREQUENCY' && dim.subtype !== 'REGION';
          },
        ),
      };
    }

    return {
      map,
      getDimensionsMetadata: (urn: ShortUrn) => map[urn],
      getDimensionMetadata: (urn: ShortUrn, key: DimensionKey) =>
        map[urn]?.[key],
      getRegionDimension: (urn: ShortUrn) =>
        dimensionsBySubtype[urn]?.['REGION'],
      getFrequencyDimension: (urn: ShortUrn) =>
        dimensionsBySubtype[urn]?.['FREQUENCY'],
      getIndicatorDimensions: (urn: ShortUrn) =>
        dimensionsByType[urn]?.['INDICATOR'] ?? [],
      getDimensionsScheme: (urn: ShortUrn) => schemesCache[urn],
      getDatasetLastUpdated: (dataset) => {
        if (!dataset) {
          return undefined;
        }

        const urn = generateShortUrn(
          dataset.id,
          dataset.version,
          dataset.agencyID,
        );

        return lastUpdatedMap[urn] || getLastUpdatedTime(dataset);
      },
    };
  }, [map, lastUpdatedMap]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useDatasetDimensionsMetadataMap() {
  return useContext(Context);
}

export function useDatasetDimensionsMetadataMapOptional() {
  return useContext(Context);
}
