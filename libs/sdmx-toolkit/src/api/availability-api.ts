import { SeriesFilterDto } from '../models/series-filter';
import { StructuralMetaData } from '../models/structural-metadata/structural-metadata';
import { splitUrn } from '../utils/urn';
import { SdmxApiClient } from './sdmx-api-client';
import { SdmxReferences, SdmxAvailabilityMode } from '../types/references';
import { StructuralMetaDataV3 } from '../models';
import { mapAvailabilityV3ToPlus } from '../utils/map-availability';

const AVAILABILITY_URL = (agency = '', id = '', version = '') =>
  `sdmx/3.0/availability/dataflow/${agency}/${id}/${version}`;

export class AvailabilityApi {
  constructor(private client: SdmxApiClient) {}

  async getConstraints(
    urn: string,
    filters?: SeriesFilterDto[],
    token?: string,
  ): Promise<StructuralMetaData> {
    const { agency, id, version } = splitUrn(urn);

    const body = {
      filters: filters || [],
      mode: SdmxAvailabilityMode.AVAILABLE,
      references: SdmxReferences.NONE,
    };
    const url = AVAILABILITY_URL(agency, id, version);

    if (this.client.config.sdmxProxyUrl) {
      const resp = await this.client.postRequest<StructuralMetaDataV3>(
        url,
        { body },
        this.client.config.sdmxProxyUrl,
        token,
      );
      return mapAvailabilityV3ToPlus(resp);
    }

    return await this.client.postRequest<StructuralMetaData>(
      url,
      { body },
      this.client.config.constrainsApiUrl || this.client.config.apiUrl,
      token,
    );
  }
}
