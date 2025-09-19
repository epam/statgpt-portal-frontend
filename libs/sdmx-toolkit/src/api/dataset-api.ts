import { SdmxApiClient } from './sdmx-api-client';
import { StructuralMetaData } from '../models/structural-metadata';
import { splitUrn } from '../utils/urn';
import { DataMessage } from '../models/data/data-message';
import { getRequestAcceptHeader } from '../utils/get-file-headers';
import { SdmxReferences } from '../types/references';
import { SdmxDetails } from '../types/details';
import { ALL_ATTRIBUTES } from '../constants/attributes';
import { generateDatasetDataRequest } from '../utils/get-dataset';
import { DatasetQueryFilters } from '../models/dataset-query-filters';
import { FileColumnsAttribute, SdmxDataFormat } from '../types/files';

const DATASET_URL = (
  agency = '',
  id = '',
  version = '',
  references = SdmxReferences.DESCENDANTS,
) =>
  `sdmx/3.0/structure/dataflow/${agency}/${id}/${version}?references=${references}&detail=${SdmxDetails.REFERENCE_PARTIAL}&forceDataflowDynamicAnnotations=true`;

export class DatasetApi {
  constructor(private client: SdmxApiClient) {}

  async getDataSet(
    urn: string,
    references?: SdmxReferences,
  ): Promise<StructuralMetaData | null> {
    const { agency, id, version } = splitUrn(urn);
    return await this.client.getRequest<StructuralMetaData>(
      DATASET_URL(agency, id, version, references),
    );
  }

  async getDatasetData(
    urn: string,
    filters: DatasetQueryFilters,
  ): Promise<DataMessage | null> {
    const queryParams = new URLSearchParams({
      includeHistory: 'false',
      limit: '10000',
      attributes: ALL_ATTRIBUTES,
      dimensionAtObservation: 'TIME_PERIOD', // TODO: use time dimensions
      detail: SdmxDetails.FULL,
    }).toString();

    const urlWithParams = generateDatasetDataRequest(urn, queryParams, filters);
    return await this.client.request<DataMessage>(urlWithParams, {
      method: 'GET',
    });
  }

  async downloadDataSet(
    urn: string,
    dataFormat: SdmxDataFormat,
    language: string,
    columnAttribute: FileColumnsAttribute,
    filters: DatasetQueryFilters,
    filename: string,
    isMetadata = false,
  ) {
    const queryParams = new URLSearchParams({
      format: dataFormat,
      compress: 'false',
      attributes: isMetadata ? 'all' : 'none',
    }).toString();

    const urlWithParams = generateDatasetDataRequest(urn, queryParams, filters);

    return this.client.streamRequest(
      urlWithParams,
      {
        method: 'GET',
        headers: {
          Accept: getRequestAcceptHeader(dataFormat, columnAttribute),
          'Accept-language': language,
        },
      },
      filename,
    );
  }
}
