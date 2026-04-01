export interface SdmxApiConfig {
  apiUrl: string;
  constrainsApiUrl?: string; // TODO: remove after fix api for constrains
  sdmxProxyUrl?: string;
  sdmxPlusUrl?: string;
  jwt?: string;
  apiKey?: string;
}
