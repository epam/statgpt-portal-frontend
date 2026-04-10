import { splitUrn } from '../utils';
import { StructuralMetaData } from '../models';
import { SdmxApiClient } from './sdmx-api-client';

export class HierarchyApi {
  constructor(private client: SdmxApiClient) {}

  async getAvailableHierarchies(
    codelistUrn: string,
    token?: string,
  ): Promise<StructuralMetaData> {
    const { agency, id, version } = splitUrn(codelistUrn);
    const baseUrl = `${this.client.config.sdmxProxyUrl}/sdmx/3.0/structure/codelist`;
    return this.client.request<StructuralMetaData>(
      `${agency}/${id}/${version}?references=hierarchy&detail=allcompletestubs`,
      { method: 'GET' },
      baseUrl,
      token,
    );
  }

  async getHierarchy(
    hierarchyUrn: string,
    token?: string,
  ): Promise<StructuralMetaData> {
    const { agency, id, version } = splitUrn(hierarchyUrn);
    const baseUrl = `${this.client.config.sdmxProxyUrl}/sdmx/3.0/structure/hierarchy`;
    return this.client.request<StructuralMetaData>(
      `${agency}/${id}/${version}?references=descendants&detail=full`,
      { method: 'GET' },
      baseUrl,
      token,
    );
  }
}
