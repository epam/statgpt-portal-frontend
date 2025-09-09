export const isValidUrl = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url);
    return ['http:', 'https:', 'data:'].includes(parsedUrl.protocol);
  } catch {
    return false;
  }
};

export const sanitizeUrl = (url: string): string => {
  if (!isValidUrl(url)) return '';
  return url;
};
