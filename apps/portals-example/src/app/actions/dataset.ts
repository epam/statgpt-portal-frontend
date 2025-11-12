'use server';

import {
  StructuralMetaData,
  DataMessage,
  DatasetQueryFilters,
  SdmxReferences,
} from '@epam/statgpt-sdmx-toolkit';
import { apiLogger } from '../../core/logger';
import { datasetApi } from '../api/api';
import {
  checkSessionInvalid,
  INVALID_SESSION_RESPONSE,
} from '../../utils/auth/check-session';
import { makeSuccessResponse } from '../../utils/auth/success-response';
import { ApiResponse } from '@epam/statgpt-shared-toolkit';

export async function getDataSet(
  urn: string,
  references?: SdmxReferences,
): Promise<ApiResponse<StructuralMetaData | null>> {
  try {
    const isInvalidSession = await checkSessionInvalid();
    if (isInvalidSession) {
      return INVALID_SESSION_RESPONSE;
    }
    return makeSuccessResponse(await datasetApi.getDataSet(urn, references));
  } catch (error) {
    apiLogger.error(`Failed to fetch dataflow ${urn}: ${error}`);
    throw new Error('Failed to fetch dataflow');
  }
}

export async function getDataSetData(
  urn: string,
  filters: DatasetQueryFilters,
): Promise<ApiResponse<DataMessage | null>> {
  try {
    const isInvalidSession = await checkSessionInvalid();
    if (isInvalidSession) {
      return INVALID_SESSION_RESPONSE;
    }
    return makeSuccessResponse(await datasetApi.getDatasetData(urn, filters));
  } catch (error) {
    apiLogger.error(`Failed to fetch dataset data ${urn}: ${error}`);
    throw new Error('Failed to fetch dataset data');
  }
}
