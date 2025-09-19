import { SeriesFilterDto } from '../models/series-filter';
import { StructuralMetaData } from '../models/structural-metadata';
import { splitUrn } from '../utils/urn';
import { SdmxApiClient } from './sdmx-api-client';
import { SdmxReferences, SdmxAvailabilityMode } from '../types/references';

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
