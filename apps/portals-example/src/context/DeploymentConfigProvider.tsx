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
const EMPTY_STRING = '';

export function DeploymentConfigProvider({
  children,
  config,
}: DeploymentConfigProviderProps) {
  const suggestionsList = config?.suggestionsList ?? EMPTY_SUGGESTIONS;
  const welcomeText = config?.welcomeText ?? EMPTY_STRING;
  const welcomeDescription = config?.welcomeDescription ?? EMPTY_STRING;
  const welcomeInputPlaceholder =
    config?.welcomeInputPlaceholder ?? EMPTY_STRING;

  const value = useMemo<DeploymentConfiguration>(
    () => ({
      suggestionsList,
      welcomeText,
      welcomeDescription,
      welcomeInputPlaceholder,
    }),
    [suggestionsList, welcomeText, welcomeDescription, welcomeInputPlaceholder],
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
