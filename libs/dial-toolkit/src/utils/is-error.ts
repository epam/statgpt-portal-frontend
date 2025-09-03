export const isError = (error: unknown) => {
  return error instanceof Error && error.message.includes('404');
};
