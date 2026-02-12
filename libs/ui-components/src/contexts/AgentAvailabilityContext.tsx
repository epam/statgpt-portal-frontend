'use client';

import React, { createContext, ReactNode, useContext, useMemo } from 'react';

export interface AgentAvailabilityContextValue {
  isAgentAvailable: boolean;
}

const AgentAvailabilityContext =
  createContext<AgentAvailabilityContextValue | null>(null);

export function AgentAvailabilityProvider({
  children,
  isAgentAvailable,
}: {
  children: ReactNode;
  isAgentAvailable: boolean;
}) {
  const value = useMemo(() => ({ isAgentAvailable }), [isAgentAvailable]);
  return (
    <AgentAvailabilityContext.Provider value={value}>
      {children}
    </AgentAvailabilityContext.Provider>
  );
}

export function useAgentAvailability() {
  const context = useContext(AgentAvailabilityContext);
  if (!context) {
    throw new Error(
      'useAgentAvailability must be used within AgentAvailabilityProvider',
    );
  }
  return context;
}
