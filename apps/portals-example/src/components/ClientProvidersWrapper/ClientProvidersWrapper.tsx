'use client';

import { DatasetDimensionsMetadataMapProvider } from '@epam/statgpt-conversation-view';
import { DatasetDimensionsMetadataMap } from '@epam/statgpt-sdmx-toolkit';
import { AgentAvailabilityProvider } from '@epam/statgpt-ui-components';
import { ReactNode } from 'react';

export const ClientProvidersWrapper = ({
  children,
  isAgentAvailable,
  datasetDimensionsMetadataMap,
}: {
  children: ReactNode;
  isAgentAvailable: boolean;
  datasetDimensionsMetadataMap: DatasetDimensionsMetadataMap;
}) => {
  return (
    <AgentAvailabilityProvider isAgentAvailable={isAgentAvailable}>
      <DatasetDimensionsMetadataMapProvider map={datasetDimensionsMetadataMap}>
        {children}
      </DatasetDimensionsMetadataMapProvider>
    </AgentAvailabilityProvider>
  );
};
