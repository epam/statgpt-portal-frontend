'use client';
import React, { createContext, ReactNode, useContext, useMemo } from 'react';

export interface CrossDatasetModeContextValue {
  isCrossDatasetModeOn: boolean;
}

const CrossDatasetModeContext =
  createContext<CrossDatasetModeContextValue | null>(null);

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
  const context = useContext(CrossDatasetModeContext);
  if (!context) {
    throw new Error(
      'useCrossDatasetMode must be used within CrossDatasetModeProvider',
    );
  }
  return context;
}
