'use client';

import React, { createContext, ReactNode, useContext, useMemo } from 'react';
import {
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
    const getDimensions = (urn: ShortUrn) => map[urn];

    const getDimension: GetDimensionMetadata = (urn, dimensionKey) => {
      return map[urn]?.[dimensionKey];
    };

    return {
      map,
      getDimensionsMetadata: getDimensions,
      getDimensionMetadata: getDimension,
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
