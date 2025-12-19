import { HfInference } from '@huggingface/inference';
import config from '../config';
import { TextChunk, EmbeddingResult } from '../types';
import { EmbeddingError } from '../utils/errors';

export class EmbeddingService {
  private hf: HfInference;
  private readonly batchSize: number = 10;
  private readonly E5_PREFIX = 'passage: ';

  constructor() {
    this.hf = new HfInference(config.huggingface.apiKey);
  }

  /**
   * Generate embeddings for text chunks
   * CRITICAL: Adds "passage: " prefix for E5 model compatibility
   * @param chunks - Array of text chunks to embed
   * @returns Array of embedding results with metadata
   */
  async generateEmbeddings(chunks: TextChunk[]): Promise<EmbeddingResult[]> {
    const results: EmbeddingResult[] = [];

    // Process in batches to avoid rate limits
    for (let i = 0; i < chunks.length; i += this.batchSize) {
      const batch = chunks.slice(i, i + this.batchSize);
      const batchResults = await this.processBatch(batch);
      results.push(...batchResults);

      // Log progress
      console.log(
        `Processed embeddings: ${Math.min(i + this.batchSize, chunks.length)}/${
          chunks.length
        }`
      );

      // Small delay between batches to be respectful to API
      if (i + this.batchSize < chunks.length) {
        await this.delay(100);
      }
    }

    return results;
  }

  /**
   * Process a batch of chunks
   * @param batch - Batch of chunks to process
   * @returns Embedding results for the batch
   */
  private async processBatch(batch: TextChunk[]): Promise<EmbeddingResult[]> {
    const promises = batch.map((chunk) => this.embedSingleChunk(chunk));

    try {
      return await Promise.all(promises);
    } catch (error) {
      throw new EmbeddingError(
        `Failed to generate embeddings: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Generate embedding for a single chunk with retries
   * @param chunk - Text chunk to embed
   * @param retries - Number of retry attempts
   * @returns Embedding result
   */
  private async embedSingleChunk(
    chunk: TextChunk,
    retries: number = 3
  ): Promise<EmbeddingResult> {
    // CRITICAL: Add E5 model prefix
    const prefixedText = this.E5_PREFIX + chunk.text;

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const embedding = await this.hf.featureExtraction({
          model: config.huggingface.model,
          inputs: prefixedText,
        });

        // Extract the embedding array
        let embeddingArray: number[];
        if (Array.isArray(embedding)) {
          embeddingArray = embedding as number[];
        } else {
          throw new Error('Unexpected embedding format');
        }

        // Generate unique ID
        const id = this.generateId(chunk.metadata.filename, chunk.metadata.chunkIndex);

        return {
          id,
          values: embeddingArray,
          metadata: {
            filename: chunk.metadata.filename,
            chunkIndex: chunk.metadata.chunkIndex,
            text: chunk.text, // Store original text without prefix
            timestamp: new Date().toISOString(),
          },
        };
      } catch (error) {
        if (attempt === retries - 1) {
          throw new EmbeddingError(
            `Failed to embed chunk after ${retries} attempts: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`
          );
        }

        // Exponential backoff
        await this.delay(Math.pow(2, attempt) * 1000);
      }
    }

    throw new EmbeddingError('Embedding generation failed');
  }

  /**
   * Generate a unique ID for a vector
   * @param filename - Original filename
   * @param chunkIndex - Index of the chunk
   * @returns Unique ID string
   */
  private generateId(filename: string, chunkIndex: number): string {
    const timestamp = Date.now();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9]/g, '_');
    return `${sanitizedFilename}_${chunkIndex}_${timestamp}`;
  }

  /**
   * Utility function to add delay
   * @param ms - Milliseconds to delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export default new EmbeddingService();
