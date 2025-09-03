export const getTimePeriod = (timePeriod: string): Date | null => {
  return !isNaN(Date.parse(timePeriod)) ? new Date(timePeriod) : null;
};
