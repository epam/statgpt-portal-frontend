export interface DownloadTitles {
  partialDataset: string;
  fullDataset: string;
  download: string;
  includeMetadata: string;
  metadata: string;
  all: string;
  none: string;
  dataFormat: string;
  attributes: string;
  downloadType: string;
  dataset: string;
  idOptions: string;
  idOptionsDescription: string;
  nameOptions: string;
  nameOptionsDescription: string;
  idAndNameOptions: string;
  idAndNameOptionsDescription: string;
  close?: string;
  cancel?: string;
  datasetsToDownload?: string;
  rows?: string;
  filesWillBeDownloaded?: (count: number) => string;
  oneFilePerDataset?: string;
}
