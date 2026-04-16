import { SdmxDataFormat } from '../types/files';

export const getRequestAcceptHeader = (
  format: string,
  attribute: string,
): string => {
  switch (format) {
    case SdmxDataFormat.CSV:
      return getFileAcceptHeader(
        'application/vnd.sdmx.data+csv;version=2.0.0',
        attribute,
      );
    case SdmxDataFormat.XML:
      return 'application/vnd.sdmx.data+xml;version=3.0.0';
    case SdmxDataFormat.JSON:
      return 'application/vnd.sdmx.data+json;version=2.1';
    default:
      return getFileAcceptHeader(
        'application/vnd.sdmx.data+csv;version=2.0.0',
        attribute,
      );
  }
};

const getFileAcceptHeader = (acceptHeader: string, attribute: string): string =>
  `${acceptHeader}; labels=${attribute}`;
