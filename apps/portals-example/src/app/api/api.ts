import {
  AvailabilityApi,
  DatasetApi,
  SdmxApiClient,
} from '@epam/statgpt-sdmx-toolkit';
import { DialApiClient, ConversationApi } from '@epam/statgpt-dial-toolkit';

export const DEFAULT_MODEL_ID = process.env.DEFAULT_MODEL || 'gpt-4-turbo';

export const sdmxApiClient = new SdmxApiClient({
  apiUrl: process.env.SDMX_API_URL || '',
  constrainsApiUrl: process.env.CONSTRAINS_SDMX_API_URL || '',
  sdmxProxyUrl: process.env.SDMX_PROXY_URL || '',
  apiKey: process.env.SDMX_AUTH_KEY,
});

export const datasetApi = new DatasetApi(sdmxApiClient);
export const availabilityApi = new AvailabilityApi(sdmxApiClient);

const config = {
  host: process.env.DIAL_API_URL || '',
  version: process.env.DIAL_API_VERSION || '2025-01-01-preview',
  apiKey: process.env.DIAL_API_KEY || '',
};

export const dialApiClient = new DialApiClient(config);
export const conversationApi = new ConversationApi(dialApiClient);
