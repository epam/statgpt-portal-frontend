export const makeSuccessResponse = <T>(data: T) => {
  return {
    data,
    success: true,
  };
};
