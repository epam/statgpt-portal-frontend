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
      return getFileAcceptHeader(
        'application/vnd.sdmx.data+xml;version=3.0.0',
        attribute,
      );
    case SdmxDataFormat.JSON:
      return getFileAcceptHeader(`application/${format}`, attribute);
    default:
      return getFileAcceptHeader(
        'application/vnd.sdmx.data+csv;version=2.0.0',
        attribute,
      );
  }
};

export const getResponseContentType = (format: string): string => {
  switch (format) {
    case SdmxDataFormat.CSV:
      return 'text/csv; charset=utf-8';
    case SdmxDataFormat.XML:
      return 'application/xml; charset=utf-8';
    case SdmxDataFormat.JSON:
      return 'application/json; charset=utf-8';
    default:
      return 'text/csv; charset=utf-8';
  }
};

const getFileAcceptHeader = (acceptHeader: string, attribute: string): string =>
  `${acceptHeader}; labels=${attribute}`;
