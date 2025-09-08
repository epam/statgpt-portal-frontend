export const parseBoolean = (value: string | undefined): boolean => {
  return Boolean(value?.toLowerCase() === 'true');
};
