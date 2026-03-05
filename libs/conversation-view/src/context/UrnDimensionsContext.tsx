'use client';

import React, { createContext, ReactNode, useContext, useMemo } from 'react';
import {
  DimensionConfig,
  DimensionKey,
  ShortUrn,
  UrnDimensionsIndex,
} from '@epam/statgpt-sdmx-toolkit';

type GetDimension = (
  urn: ShortUrn,
  dimensionKey: DimensionKey,
) => DimensionConfig | undefined;

interface UrnDimensionsContextValue {
  index: UrnDimensionsIndex;
  getDimensions: (
    urn: ShortUrn,
  ) => Record<DimensionKey, DimensionConfig> | undefined;
  getDimension: GetDimension;
}

const Context = createContext<UrnDimensionsContextValue | null>(null);

export function UrnDimensionsProvider({
  index,
  children,
}: {
  index: UrnDimensionsIndex;
  children: ReactNode;
}) {
  const value = useMemo<UrnDimensionsContextValue>(() => {
    const getDimensions = (urn: ShortUrn) => index[urn];

    const getDimension: GetDimension = (urn, dimensionKey) => {
      return index[urn]?.[dimensionKey];
    };

    return { index, getDimensions, getDimension };
  }, [index]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useUrnDimensions() {
  const ctx = useContext(Context);
  if (!ctx) {
    throw new Error(
      'useUrnDimensions must be used within UrnDimensionsProvider',
    );
  }
  return ctx;
}

export function useUrnDimensionsOptional() {
  return useContext(Context);
}
