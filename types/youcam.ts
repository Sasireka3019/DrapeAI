export type YouCamGarmentCategory =
  | "full_body"
  | "upper_body"
  | "lower_body"
  | "auto";

export interface YouCamTryOnRequest {
  userImageBuffer: Buffer;
  userImageContentType: string;
  garmentImageUrl: string;
  garmentCategory?: YouCamGarmentCategory;
}

export interface YouCamTryOnResponse {
  resultUrl: string;
}

export interface YouCamErrorResponse {
  error: string;
  code?: number;
}
