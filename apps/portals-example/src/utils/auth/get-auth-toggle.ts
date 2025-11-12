export const getIsEnableAuthToggle = (): boolean => {
  return !!process.env.NEXTAUTH_URL && !process.env.DIAL_API_KEY;
};
