import { splitUrn } from '../utils/urn';
import { StructuralMetaData } from '../models/structural-metadata/structural-metadata';
import { SdmxApiClient } from './sdmx-api-client';

const buildGlossaryUrl = (agency: string, id: string, version: string) =>
  `/structure/glossary/${agency}/${id}/${version}?references=hierarchy&detail=allcompletestubs`;

const buildHierarchyUrl = (agency: string, id: string, version: string) =>
  `/structure/hierarchy/${agency}/${id}/${version}?references=descendants&detail=full`;

export class HierarchyApi {
  constructor(private client: SdmxApiClient) {}

  async getAvailableHierarchies(
    codelistUrn: string,
  ): Promise<StructuralMetaData> {
    const { agency, id, version } = splitUrn(codelistUrn);
    return this.client.request<StructuralMetaData>(
      buildGlossaryUrl(agency ?? '', id ?? '', version ?? ''),
      { method: 'GET' },
      this.client.config.sdmxPlusUrl || this.client.config.apiUrl,
    );
  }

  async getHierarchy(hierarchyUrn: string): Promise<StructuralMetaData> {
    const { agency, id, version } = splitUrn(hierarchyUrn);
    return this.client.request<StructuralMetaData>(
      buildHierarchyUrl(agency ?? '', id ?? '', version ?? ''),
      { method: 'GET' },
      this.client.config.sdmxPlusUrl || this.client.config.apiUrl,
    );
  }
}
