export interface ApiResponse {
  data: unknown;
  debug: {
    url: string;
    headers: Record<string, string>;
  };
}