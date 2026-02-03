import { FormSchemaButtonOption } from '@epam/ai-dial-shared';
import { ApiResponse } from '@epam/statgpt-shared-toolkit';
import { apiRequest } from '../api-client';

const CONFIGURATION_API_ENDPOINT = '/api/configuration';

export async function getDeploymentConfigurationApi(): Promise<
  ApiResponse<{
    suggestionsList: FormSchemaButtonOption[];
    welcomeText: string;
  }>
> {
  return apiRequest(
    CONFIGURATION_API_ENDPOINT,
    'Failed to fetch configuration',
  );
}
