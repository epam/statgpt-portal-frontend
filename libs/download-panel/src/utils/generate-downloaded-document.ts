import { SdmxDataFormat } from '@epam/statgpt-sdmx-toolkit';

export const generateDownloadedFile = (
  fileContent = '',
  fileName = '',
  format = '',
) => {
  const BOM = '\uFEFF';

  const content =
    format === SdmxDataFormat.JSON
      ? JSON.stringify(fileContent, null, 2)
      : fileContent;

  const blob = new Blob([BOM + content], {
    type:
      format === SdmxDataFormat.CSV
        ? `text/${format};charset=utf-8`
        : `application/${format}`,
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileName}.${format}`;
  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};
