'use client';

import { UrnDimensionsIndex } from '@epam/statgpt-sdmx-toolkit';
import {
  AgentAvailabilityProvider,
  UrnDimensionsProvider,
} from '@epam/statgpt-ui-components';
import { ReactNode } from 'react';

export const ClientProvidersWrapper = ({
  children,
  isAgentAvailable,
  urnDimensionIndex,
}: {
  children: ReactNode;
  isAgentAvailable: boolean;
  urnDimensionIndex: UrnDimensionsIndex;
}) => {
  return (
    <AgentAvailabilityProvider isAgentAvailable={isAgentAvailable}>
      <UrnDimensionsProvider index={urnDimensionIndex}>
        {children}
      </UrnDimensionsProvider>
    </AgentAvailabilityProvider>
  );
};
