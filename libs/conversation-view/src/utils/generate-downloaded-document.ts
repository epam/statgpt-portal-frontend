export const generateDownloadedFile = (
  fileContent = '',
  fileName = '',
  format = '',
) => {
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + fileContent], {
    type: `text/${format};charset=utf-8`,
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
