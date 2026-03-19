'use client';

import { createContext, ReactNode, useContext, useMemo } from 'react';

export interface ConversationViewFeatureToggles {
  isMetadataInSidePanel: boolean;
}

const defaultFeatureToggles: ConversationViewFeatureToggles = {
  isMetadataInSidePanel: false,
};

const ConversationViewFeatureTogglesContext =
  createContext<ConversationViewFeatureToggles>(defaultFeatureToggles);

export function ConversationViewFeatureTogglesProvider({
  children,
  isMetadataInSidePanel = false,
}: {
  children: ReactNode;
  isMetadataInSidePanel?: boolean;
}) {
  const value = useMemo<ConversationViewFeatureToggles>(
    () => ({
      isMetadataInSidePanel,
    }),
    [isMetadataInSidePanel],
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
