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
    const isStandaloneSdmxProxy = !!this.client.config.sdmxProxyUrl;
    const needMapResponse =
      isStandaloneSdmxProxy || this.client.config.isDialProxyMode;
    const apiUrn = isStandaloneSdmxProxy
      ? this.client.config.sdmxProxyUrl
      : this.client.config.constrainsApiUrl || this.client.config.apiUrl;

    if (needMapResponse) {
      const resp = await this.client.postRequest<StructuralMetaDataV3>(
        url,
        { body },
        apiUrn,
        token,
      );
      return mapAvailabilityV3ToPlus(resp);
    }

    return await this.client.postRequest<StructuralMetaData>(
      url,
      { body },
      apiUrn,
      token,
    );
  }
}
