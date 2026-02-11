import { createContext, ReactNode, useContext, useMemo } from 'react';
import { InlineAlertConfig } from './types';

const InlineAlertConfigContext = createContext<InlineAlertConfig | null>(null);

export interface InlineAlertProviderProps {
  value?: InlineAlertConfig;
  children: ReactNode;
}

export function InlineAlertProvider({
  value,
  children,
}: InlineAlertProviderProps) {
  const memo = useMemo(() => value ?? {}, [value]);

  return (
    <InlineAlertConfigContext.Provider value={memo}>
      {children}
    </InlineAlertConfigContext.Provider>
  );
}

export function useInlineAlertConfig() {
  return useContext(InlineAlertConfigContext);
}
