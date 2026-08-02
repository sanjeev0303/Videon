export const createSuccessResponse = <T>(message: string, data: T) => ({
  message,
  data,
});
