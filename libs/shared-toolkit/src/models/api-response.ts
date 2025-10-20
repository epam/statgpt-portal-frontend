export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  statusCode?: number;
  message?: string;
}
