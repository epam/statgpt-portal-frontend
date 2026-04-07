export interface SdmxApiConfig {
  apiUrl: string;
  constrainsApiUrl?: string; // TODO: remove after fix api for constrains
  sdmxProxyUrl?: string;
  sdmxPlusUrl?: string;
  /** Full base URL for the codelist endpoint (host + path prefix).
   *  The library appends /{agency}/{id}/{version}?... to this value.
   *  When not set, defaults to sdmxProxyUrl + '/sdmx/3.0/structure/codelist'.
   *  Example (SDMX-Plus): `${sdmxPlusUrl}/structure/glossary` */
  codelistUrl?: string;
  /** Full base URL for the hierarchy endpoint (host + path prefix).
   *  The library appends /{agency}/{id}/{version}?... to this value.
   *  When not set, defaults to sdmxProxyUrl + '/sdmx/3.0/structure/hierarchy'.
   *  Example (SDMX-Plus): `${sdmxPlusUrl}/structure/hierarchy` */
  hierarchyUrl?: string;
  jwt?: string;
  apiKey?: string;
}
