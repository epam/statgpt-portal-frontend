import { SdmxApiClient } from '@statgpt/sdmx-toolkit/src/api/sdmx-api-client';
import { DatasetApi } from '@statgpt/sdmx-toolkit/src/api/dataset-api';
import { AvailabilityApi } from '@statgpt/sdmx-toolkit/src/api/availability-api';
import { SdmxApiConfig } from './sdmx-config';

export let sdmxApiClient: SdmxApiClient;
export let datasetApi: DatasetApi;
export let availabilityApi: AvailabilityApi;

export const setSdmxConfig = (config: SdmxApiConfig) => {
  sdmxApiClient = new SdmxApiClient(config);
  datasetApi = new DatasetApi(sdmxApiClient);
  availabilityApi = new AvailabilityApi(sdmxApiClient);
};

export * from './sdmx-api-client';
export * from './dataset-api';
export * from './availability-api';
export * from './sdmx-config';
