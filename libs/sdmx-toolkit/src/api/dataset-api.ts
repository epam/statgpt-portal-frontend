import { SdmxApiClient } from '@statgpt/sdmx-toolkit/src/api/sdmx-api-client';
import { StructuralMetaData } from '@statgpt/sdmx-toolkit/src/models/structural-metadata';
import { splitUrn } from '@statgpt/sdmx-toolkit/src/utils/urn';
import {
  DataMessage,
  DownloadData,
} from '@statgpt/sdmx-toolkit/src/models/data/data-message';
import { getRequestAcceptHeader } from '@statgpt/sdmx-toolkit/src/utils/get-file-headers';
import { SdmxReferences } from '@statgpt/sdmx-toolkit/src/types/references';
import { SdmxDetails } from '@statgpt/sdmx-toolkit/src/types/details';
import { generateDatasetDataRequest } from '@statgpt/sdmx-toolkit/src/utils/get-dataset';
import { DatasetQueryFilters } from '@statgpt/sdmx-toolkit/src/models/dataset-query-filters';
import {
  FileColumnsAttribute,
  SdmxDataFormat,
} from '@statgpt/sdmx-toolkit/src/types/files';

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
    isMetadata = false,
  ): Promise<DownloadData> {
    const queryParams = new URLSearchParams({
      format: dataFormat,
      compress: 'false',
      attributes: isMetadata ? 'all' : 'none',
    }).toString();

    const urlWithParams = generateDatasetDataRequest(urn, queryParams, filters);

    return await this.client.request<DownloadData>(urlWithParams, {
      method: 'GET',
      headers: {
        Accept: getRequestAcceptHeader(dataFormat, columnAttribute),
        'Accept-language': language,
      },
    });
  }
}
