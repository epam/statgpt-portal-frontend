'use client';

import { createContext, ReactNode, useContext, useMemo } from 'react';

export interface ConversationViewFeatureToggles {
  isMetadataInSidePanel: boolean;
  isCrossDatasetModeOn: boolean;
  isTableSettingsFeatureEnabled: boolean;
}

const defaultFeatureToggles: ConversationViewFeatureToggles = {
  isMetadataInSidePanel: false,
  isCrossDatasetModeOn: false,
  isTableSettingsFeatureEnabled: false,
};

const ConversationViewFeatureTogglesContext =
  createContext<ConversationViewFeatureToggles>(defaultFeatureToggles);

export function ConversationViewFeatureTogglesProvider({
  children,
  isMetadataInSidePanel = false,
  isCrossDatasetModeOn = false,
  isTableSettingsFeatureEnabled = false,
}: {
  children: ReactNode;
  isMetadataInSidePanel?: boolean;
  isCrossDatasetModeOn?: boolean;
  isTableSettingsFeatureEnabled?: boolean;
}) {
  const value = useMemo<ConversationViewFeatureToggles>(
    () => ({
      isMetadataInSidePanel,
      isCrossDatasetModeOn,
      isTableSettingsFeatureEnabled,
    }),
    [
      isMetadataInSidePanel,
      isCrossDatasetModeOn,
      isTableSettingsFeatureEnabled,
    ],
  );

  return (
    <ConversationViewFeatureTogglesContext.Provider value={value}>
      {children}
    </ConversationViewFeatureTogglesContext.Provider>
  );
}

export function useConversationViewFeatureToggles() {
  return useContext(ConversationViewFeatureTogglesContext);
}
