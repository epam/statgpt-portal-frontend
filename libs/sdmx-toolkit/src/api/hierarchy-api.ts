import { X_SOURCE_ARTEFACT_URN_HEADER } from '@epam/statgpt-shared-toolkit';
import { splitUrn } from '../utils';
import { StructuralMetaData } from '../models';
import { SdmxApiClient } from './sdmx-api-client';

export class HierarchyApi {
  constructor(private client: SdmxApiClient) {}

  async getAvailableHierarchies(
    codelistUrn: string,
    token?: string,
    sourceArtefactUrn?: string,
  ): Promise<StructuralMetaData> {
    const { agency, id, version } = splitUrn(codelistUrn);
    const apiUrl = this.client.config.sdmxProxyUrl
      ? this.client.config.sdmxProxyUrl
      : this.client.config.apiUrl;
    const baseUrl = `${apiUrl}/sdmx/3.0/structure/codelist`;
    const headers = sourceArtefactUrn
      ? { [X_SOURCE_ARTEFACT_URN_HEADER]: sourceArtefactUrn }
      : undefined;
    return this.client.request<StructuralMetaData>(
      `${agency}/${id}/${version}?references=hierarchy&detail=allcompletestubs`,
      { method: 'GET', headers },
      baseUrl,
      token,
    );
  }

  async getHierarchy(
    hierarchyUrn: string,
    token?: string,
    sourceArtefactUrn?: string,
  ): Promise<StructuralMetaData> {
    const { agency, id, version } = splitUrn(hierarchyUrn);
    const apiUrl = this.client.config.sdmxProxyUrl
      ? this.client.config.sdmxProxyUrl
      : this.client.config.apiUrl;
    const baseUrl = `${apiUrl}/sdmx/3.0/structure/hierarchy`;
    const headers = sourceArtefactUrn
      ? { [X_SOURCE_ARTEFACT_URN_HEADER]: sourceArtefactUrn }
      : undefined;
    return this.client.request<StructuralMetaData>(
      `${agency}/${id}/${version}?references=descendants&detail=full`,
      { method: 'GET', headers },
      baseUrl,
      token,
    );
  }
}
