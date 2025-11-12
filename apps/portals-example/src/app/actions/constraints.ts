'use server';

import { apiLogger } from '../../core/logger';
import { availabilityApi } from '../api/api';
import {
  StructuralMetaData,
  SeriesFilterDto,
} from '@epam/statgpt-sdmx-toolkit';
import {
  checkSessionInvalid,
  INVALID_SESSION_RESPONSE,
} from '../../utils/auth/check-session';
import { ApiResponse } from '@epam/statgpt-shared-toolkit';
import { makeSuccessResponse } from '../../utils/auth/success-response';

export async function getConstraints(
  urn: string,
  filters?: SeriesFilterDto[],
): Promise<ApiResponse<StructuralMetaData>> {
  try {
    const isInvalidSession = await checkSessionInvalid();
    if (isInvalidSession) {
      return INVALID_SESSION_RESPONSE;
    }
    const constraints = await availabilityApi.getConstraints(urn, filters);
    return makeSuccessResponse(constraints);
  } catch (error) {
    apiLogger.error(`Failed to fetch constraints ${urn}: ${error}`);
    throw new Error('Failed to fetch constraints');
  }
}
