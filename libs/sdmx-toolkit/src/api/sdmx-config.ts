export interface SdmxApiConfig {
  apiUrl: string;
  constrainsApiUrl?: string; // TODO: remove after fix api for constrains
  jwt?: string;
  apiKey?: string;
}
