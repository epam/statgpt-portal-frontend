import { splitUrn } from '../utils';
import { StructuralMetaData } from '../models';
import { SdmxApiClient } from './sdmx-api-client';

const buildGlossaryUrl = (agency: string, id: string, version: string) =>
  `sdmx/3.0/structure/codelist/${agency}/${id}/${version}?references=hierarchy&detail=allcompletestubs`;

const buildHierarchyUrl = (agency: string, id: string, version: string) =>
  `sdmx/3.0/structure/hierarchy/${agency}/${id}/${version}?references=descendants&detail=full`;

export class HierarchyApi {
  constructor(private client: SdmxApiClient) {}

  async getAvailableHierarchies(
    codelistUrn: string,
  ): Promise<StructuralMetaData> {
    const { agency, id, version } = splitUrn(codelistUrn);
    return this.client.request<StructuralMetaData>(
      buildGlossaryUrl(agency ?? '', id ?? '', version ?? ''),
      { method: 'GET' },
      this.client.config.sdmxProxyUrl,
    );
  }

  async getHierarchy(hierarchyUrn: string): Promise<StructuralMetaData> {
    const { agency, id, version } = splitUrn(hierarchyUrn);
    return this.client.request<StructuralMetaData>(
      buildHierarchyUrl(agency ?? '', id ?? '', version ?? ''),
      { method: 'GET' },
      this.client.config.sdmxProxyUrl,
    );
  }
}
