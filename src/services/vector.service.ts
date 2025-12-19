import { Pinecone } from '@pinecone-database/pinecone';
import config from '../config';
import { EmbeddingResult } from '../types';
import { VectorStorageError } from '../utils/errors';

export class VectorService {
  private pinecone: Pinecone;
  private readonly batchSize: number = 50;

  constructor() {
    this.pinecone = new Pinecone({
      apiKey: config.pinecone.apiKey,
    });
  }

  /**
   * Upsert embedding vectors to Pinecone in batches
   * @param embeddings - Array of embedding results to upsert
   * @returns Number of vectors successfully upserted
   */
  async upsertVectors(embeddings: EmbeddingResult[]): Promise<number> {
    try {
      const index = this.pinecone.index(config.pinecone.indexName);
      let totalUpserted = 0;

      // Process in batches of 50
      for (let i = 0; i < embeddings.length; i += this.batchSize) {
        const batch = embeddings.slice(i, i + this.batchSize);

        // Format vectors for Pinecone
        const vectors = batch.map((embedding) => ({
          id: embedding.id,
          values: embedding.values,
          metadata: {
            filename: embedding.metadata.filename,
            chunkIndex: embedding.metadata.chunkIndex,
            text: embedding.metadata.text,
            timestamp: embedding.metadata.timestamp,
          },
        }));

        // Upsert batch
        await index.upsert(vectors);

        totalUpserted += vectors.length;

        console.log(
          `Upserted vectors: ${Math.min(
            i + this.batchSize,
            embeddings.length
          )}/${embeddings.length}`
        );

        // Small delay between batches
        if (i + this.batchSize < embeddings.length) {
          await this.delay(100);
        }
      }

      return totalUpserted;
    } catch (error) {
      throw new VectorStorageError(
        `Failed to upsert vectors to Pinecone: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Verify connection to Pinecone index
   * @returns True if connection is successful
   */
  async verifyConnection(): Promise<boolean> {
    try {
      const index = this.pinecone.index(config.pinecone.indexName);
      const stats = await index.describeIndexStats();
      console.log('Pinecone connection verified:', stats);
      return true;
    } catch (error) {
      throw new VectorStorageError(
        `Failed to connect to Pinecone: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Utility function to add delay
   * @param ms - Milliseconds to delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export default new VectorService();
