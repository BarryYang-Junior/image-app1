export interface ProcessedImageResult {
  originalUrl: string;
  processedUrl: string | null;
  isLoading: boolean;
  error: string | null;
}

export enum AppState {
  IDLE = 'IDLE',
  PREVIEW = 'PREVIEW',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface RemoveWatermarkOptions {
  imageBase64: string;
  mimeType: string;
  instruction?: string;
  apiKey?: string;
}