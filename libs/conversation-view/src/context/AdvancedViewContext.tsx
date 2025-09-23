'use client';

import { createContext, FC, ReactNode, useContext, useState } from 'react';

interface AdvancedViewContextType {
  isOpenedAdvancedView: boolean;
  setIsOpenedAdvancedView: (isOpenedAdvancedView: boolean) => void;
}

const AdvancedViewContext = createContext<AdvancedViewContextType | undefined>(
  undefined,
);

export const AdvancedViewProvider: FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isOpenedAdvancedView, setIsOpenedAdvancedView] = useState(false);

  return (
    <AdvancedViewContext.Provider
      value={{
        isOpenedAdvancedView,
        setIsOpenedAdvancedView,
      }}
    >
      {children}
    </AdvancedViewContext.Provider>
  );
};

export const useAdvancedView = () => {
  const context = useContext(AdvancedViewContext);
  if (context === undefined) {
    throw new Error(
      'useAdvancedView must be used within a AdvancedViewProvider',
    );
  }
  return context;
};
