export interface TextChunk {
  text: string;
  metadata: {
    filename: string;
    chunkIndex: number;
  };
}

export interface EmbeddingResult {
  id: string;
  values: number[];
  metadata: {
    filename: string;
    chunkIndex: number;
    text: string;
    timestamp: string;
  };
}

export interface UploadResponse {
  success: boolean;
  message: string;
  data: {
    filename: string;
    chunksProcessed: number;
    vectorsUpserted: number;
    processingTimeMs: number;
  };
}
