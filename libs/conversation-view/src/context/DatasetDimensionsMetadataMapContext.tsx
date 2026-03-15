'use client';

import React, { createContext, ReactNode, useContext, useMemo } from 'react';
import {
  DatasetDimensionsScheme,
  DimensionConfig,
  DimensionKey,
  ShortUrn,
  DatasetDimensionsMetadataMap,
} from '@epam/statgpt-sdmx-toolkit';

type GetDimensionMetadata = (
  urn: ShortUrn,
  dimensionKey: DimensionKey,
) => DimensionConfig | undefined;

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
}

const Context = createContext<DatasetDimensionsMetadataMapContextValue | null>(
  null,
);

export function DatasetDimensionsMetadataMapProvider({
  map,
  children,
}: {
  map: DatasetDimensionsMetadataMap;
  children: ReactNode;
}) {
  const value = useMemo<DatasetDimensionsMetadataMapContextValue>(() => {
    const dimensionsBySubtype: Record<ShortUrn, Record<string, DimensionKey>> = {};
    const dimensionsByType: Record<ShortUrn, Record<string, DimensionKey[]>> = {};
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
      getRegionDimension: (urn: ShortUrn) => dimensionsBySubtype[urn]?.['REGION'],
      getFrequencyDimension: (urn: ShortUrn) => dimensionsBySubtype[urn]?.['FREQUENCY'],
      getIndicatorDimensions: (urn: ShortUrn) =>
        dimensionsByType[urn]?.['INDICATOR'] ?? [],
      getDimensionsScheme: (urn: ShortUrn) => schemesCache[urn],
    };
  }, [map]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useDatasetDimensionsMetadataMap() {
  const ctx = useContext(Context);
  if (!ctx) {
    throw new Error(
      'useDatasetDimensionsMetadataMap must be used within DatasetDimensionsMetadataMapProvider',
    );
  }
  return ctx;
}

export function useDatasetDimensionsMetadataMapOptional() {
  return useContext(Context);
}
