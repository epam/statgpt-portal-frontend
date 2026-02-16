'use server';

import { DIAL_API_ROUTES } from '@epam/statgpt-dial-toolkit';
import { MessageFormSchema } from '@epam/ai-dial-shared';
import { apiLogger } from '../../core/logger';
import { cookies, headers } from 'next/headers';
import { getUserToken } from '../../utils/auth/auth-request';
import { getIsEnableAuthToggle } from '../../utils/auth/get-auth-toggle';
import { dialApiClient, DEFAULT_MODEL_ID } from '../api/api';
import { DeploymentConfiguration } from '../../types/deployment-configuration';
import { ApiResponse } from '@epam/statgpt-shared-toolkit';

export async function getDeploymentConfiguration(): Promise<
  ApiResponse<DeploymentConfiguration>
> {
  try {
    const isEnableAuth = getIsEnableAuthToggle();
    const token = await getUserToken(isEnableAuth, headers(), cookies());

    const result = await dialApiClient.getRequest<MessageFormSchema>(
      DIAL_API_ROUTES.CONFIGURATION(DEFAULT_MODEL_ID),
      token?.access_token as string,
    );

    return {
      data: {
        suggestionsList: result?.properties.starter.oneOf || [],
        welcomeText: result?.properties.starter?.description || '',
      },
      success: true,
    };
  } catch (error) {
    apiLogger.error(`Failed to fetch deployment configuration: ${error}`);

    return {
      success: false,
    };
  }
}
