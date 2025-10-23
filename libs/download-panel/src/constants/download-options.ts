import {
  FileColumnsAttribute,
  SdmxDataFormat,
} from '@epam/statgpt-sdmx-toolkit';
import { DownloadSettingItem } from '../models/download-settings-item';
import { DownloadTitles } from '../models/titles';

export const DOWNLOAD_DATA_FORMATS: DownloadSettingItem[] = [
  { value: SdmxDataFormat.JSON, title: 'SDMX-JSON' },
  { value: SdmxDataFormat.XML, title: 'SDMX-ML (XML)' },
  { value: SdmxDataFormat.CSV, title: 'SDMX-CSV' },
];

export const DOWNLOAD_ATTRIBUTES = (
  titles?: DownloadTitles,
): DownloadSettingItem[] => [
  {
    value: FileColumnsAttribute.ID,
    title: titles?.idOptions || 'ID',
    description: titles?.idOptionsDescription,
  },
  {
    value: FileColumnsAttribute.NAME,
    title: titles?.nameOptions || 'Name',
    description: titles?.nameOptionsDescription,
  },
  {
    value: FileColumnsAttribute.ID_NAME,
    title: titles?.idAndNameOptions || 'Combined ID and Name',
    description: titles?.idAndNameOptionsDescription,
  },
];
