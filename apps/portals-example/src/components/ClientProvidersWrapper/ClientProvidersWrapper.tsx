'use client';

import { DatasetDimensionsMetadataMapProvider } from '@epam/statgpt-conversation-view';
import {
  DatasetDimensionsMetadataMap,
  DatasetLastUpdatedMap,
} from '@epam/statgpt-sdmx-toolkit';
import { AgentAvailabilityProvider } from '@epam/statgpt-ui-components';
import { ReactNode } from 'react';

export const ClientProvidersWrapper = ({
  children,
  isAgentAvailable,
  datasetDimensionsMetadataMap,
  datasetLastUpdatedMap,
}: {
  children: ReactNode;
  isAgentAvailable: boolean;
  datasetDimensionsMetadataMap: DatasetDimensionsMetadataMap;
  datasetLastUpdatedMap: DatasetLastUpdatedMap;
}) => {
  return (
    <AgentAvailabilityProvider isAgentAvailable={isAgentAvailable}>
      <DatasetDimensionsMetadataMapProvider
        map={datasetDimensionsMetadataMap}
        lastUpdatedMap={datasetLastUpdatedMap}
      >
        {children}
      </DatasetDimensionsMetadataMapProvider>
    </AgentAvailabilityProvider>
  );
};
