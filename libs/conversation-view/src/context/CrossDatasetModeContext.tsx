'use client';
import React, { createContext, ReactNode, useContext, useMemo } from 'react';

export interface CrossDatasetModeContextValue {
  isCrossDatasetModeOn: boolean;
}

const DEFAULT_CROSS_DATASET_MODE_CONTEXT: CrossDatasetModeContextValue = {
  isCrossDatasetModeOn: false,
};

const CrossDatasetModeContext = createContext<CrossDatasetModeContextValue>(
  DEFAULT_CROSS_DATASET_MODE_CONTEXT,
);

export function CrossDatasetModeProvider({
  children,
  isCrossDatasetModeOn,
}: {
  children: ReactNode;
  isCrossDatasetModeOn: boolean;
}) {
  const value = useMemo(
    () => ({ isCrossDatasetModeOn }),
    [isCrossDatasetModeOn],
  );
  return (
    <CrossDatasetModeContext.Provider value={value}>
      {children}
    </CrossDatasetModeContext.Provider>
  );
}

export function useCrossDatasetMode() {
  return useContext(CrossDatasetModeContext);
}
