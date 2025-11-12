'use server';

import { DIAL_API_ROUTES } from '@epam/statgpt-dial-toolkit';
import {
  MessageFormSchema,
  FormSchemaButtonOption,
} from '@epam/ai-dial-shared';
import { apiLogger } from '../../core/logger';
import { cookies, headers } from 'next/headers';
import { getUserToken } from '../../utils/auth/auth-request';
import { getIsEnableAuthToggle } from '../../utils/auth/get-auth-toggle';
import { dialApiClient, DEFAULT_MODEL_ID } from '../api/api';

export async function getDeploymentConfiguration(): Promise<{
  suggestionsList: FormSchemaButtonOption[];
  welcomeText: string;
}> {
  try {
    const isEnableAuth = getIsEnableAuthToggle();
    const token = await getUserToken(isEnableAuth, headers(), cookies());

    const result = await dialApiClient.getRequest<MessageFormSchema>(
      DIAL_API_ROUTES.CONFIGURATION(DEFAULT_MODEL_ID),
      token?.access_token as string,
    );
    return {
      suggestionsList: result?.properties.starter.oneOf || [],
      welcomeText: result?.properties.starter?.description || '',
    };
  } catch (error) {
    apiLogger.error(`Failed to fetch deployment configuration: ${error}`);
    throw new Error('Failed to fetch deployment configuration');
  }
}
