import { SeriesFilterDto } from '@statgpt/sdmx-toolkit/src/models/series-filter';
import { StructuralMetaData } from '@statgpt/sdmx-toolkit/src/models/structural-metadata';
import { splitUrn } from '@statgpt/sdmx-toolkit/src/utils/urn';
import { SdmxApiClient } from '@statgpt/sdmx-toolkit/src/api/sdmx-api-client';
import {
  SdmxReferences,
  SdmxAvailabilityMode,
} from '@statgpt/sdmx-toolkit/src/types/references';

const AVAILABILITY_URL = (agency = '', id = '', version = '') =>
  `sdmx/3.0/availability/dataflow/${agency}/${id}/${version}`;

export class AvailabilityApi {
  constructor(private client: SdmxApiClient) {}

  async getConstraints(
    urn: string,
    filters?: SeriesFilterDto[],
  ): Promise<StructuralMetaData> {
    const { agency, id, version } = splitUrn(urn);

    const body = {
      filters: filters || [],
      mode: SdmxAvailabilityMode.AVAILABLE,
      references: SdmxReferences.NONE,
    };
    const url = AVAILABILITY_URL(agency, id, version);
    return await this.client.postRequest<StructuralMetaData>(url, { body });
  }
}
