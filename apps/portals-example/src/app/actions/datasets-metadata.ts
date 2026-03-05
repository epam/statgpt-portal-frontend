'use server';

import { DIAL_API_ROUTES } from '@epam/statgpt-dial-toolkit';
import { apiLogger } from '../../core/logger';
import { cookies, headers } from 'next/headers';
import { getUserToken } from '../../utils/auth/auth-request';
import { getIsEnableAuthToggle } from '../../utils/auth/get-auth-toggle';
import { dialApiClient, DEFAULT_MODEL_ID } from '../api/api';
import { ApiResponse } from '@epam/statgpt-shared-toolkit';
import { DeploymentDatasetsResponseData } from '@epam/statgpt-sdmx-toolkit';

export async function getDatasetsMetadata(): Promise<
  ApiResponse<DeploymentDatasetsResponseData>
> {
  try {
    const isEnableAuth = getIsEnableAuthToggle();
    const token = await getUserToken(isEnableAuth, headers(), cookies());

    const result =
      await dialApiClient.getRequest<DeploymentDatasetsResponseData>(
        DIAL_API_ROUTES.DATASETS_METADATA(DEFAULT_MODEL_ID),
        token?.access_token as string,
      );

    return {
      data: result,
      success: true,
    };
  } catch (error) {
    apiLogger.error(`Failed to fetch datasets metadata: ${error}`);

    return {
      success: false,
    };
  }
}
