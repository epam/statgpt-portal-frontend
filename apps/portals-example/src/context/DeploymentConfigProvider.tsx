'use client';

import React, { createContext, ReactNode, useContext, useMemo } from 'react';
import { DeploymentConfiguration } from '../types/deployment-configuration';
import { FormSchemaButtonOption } from '@epam/ai-dial-shared';

const Context = createContext<DeploymentConfiguration | null>(null);

interface DeploymentConfigProviderProps {
  children: ReactNode;
  config?: DeploymentConfiguration | null;
}

const EMPTY_SUGGESTIONS: FormSchemaButtonOption[] = [];
const EMPTY_WELCOME = '';

export function DeploymentConfigProvider({
  children,
  config,
}: DeploymentConfigProviderProps) {
  const suggestionsList = config?.suggestionsList ?? EMPTY_SUGGESTIONS;
  const welcomeText = config?.welcomeText ?? EMPTY_WELCOME;

  const value = useMemo<DeploymentConfiguration>(
    () => ({
      suggestionsList,
      welcomeText,
    }),
    [suggestionsList, welcomeText],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useDeploymentConfig() {
  const v = useContext(Context);
  if (!v) {
    throw new Error(
      'useDeploymentConfig must be used within DeploymentConfigProvider',
    );
  }
  return v;
}
