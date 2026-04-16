export interface SdmxApiConfig {
  apiUrl: string;
  constrainsApiUrl?: string; // TODO: remove after fix api for constrains
  sdmxProxyUrl?: string;
  jwt?: string;
  apiKey?: string;
  useDialAuth?: boolean;
  isDialProxyMode?: boolean;
  dialApiKey?: string;
}
