export const getErrorMessage = (
  responseData: { data: unknown; error?: string; message?: string },
  response: Response,
) => {
  return (
    responseData.error ||
    responseData.message ||
    `${response.status} ${response.statusText}`
  );
};
