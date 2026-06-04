'use client';

import { PopUpState } from '@epam/statgpt-ui-components';
import { createContext, ReactNode, useContext, useMemo, useState } from 'react';

export interface FiltersModalStateContextValue {
  modalState: PopUpState;
  setModalState: (modalState: PopUpState) => void;
  isModalClosed: boolean;
  setIsModalClosed: (isModalClosed: boolean) => void;
}

const FiltersModalStateContext =
  createContext<FiltersModalStateContextValue | null>(null);

export function FiltersModalStateProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [modalState, setModalState] = useState(PopUpState.Closed);
  const [isModalClosed, setIsModalClosed] = useState(false);

  const value = useMemo(
    () => ({ modalState, setModalState, isModalClosed, setIsModalClosed }),
    [modalState, isModalClosed],
  );

  return (
    <FiltersModalStateContext.Provider value={value}>
      {children}
    </FiltersModalStateContext.Provider>
  );
}

export function useFiltersModalState(): FiltersModalStateContextValue {
  const context = useContext(FiltersModalStateContext);
  if (!context) {
    throw new Error(
      'useFiltersModalState must be used within FiltersModalStateProvider',
    );
  }
  return context;
}
