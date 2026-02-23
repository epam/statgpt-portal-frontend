'use client';

import { AgentAvailabilityProvider } from '@epam/statgpt-ui-components';

export const ClientProvidersWrapper = ({
  children,
  isAgentAvailable,
}: {
  children: React.ReactNode;
  isAgentAvailable: boolean;
}) => {
  return (
    <AgentAvailabilityProvider isAgentAvailable={isAgentAvailable}>
      {children}
    </AgentAvailabilityProvider>
  );
};
