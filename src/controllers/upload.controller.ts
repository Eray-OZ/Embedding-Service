import { Request, Response, NextFunction } from 'express';
import { validateFile } from '../utils/validators';
import pdfService from '../services/pdf.service';
import chunkingService from '../services/chunking.service';
import embeddingService from '../services/embedding.service';
import vectorService from '../services/vector.service';
import { UploadResponse } from '../types';

export class UploadController {
  /**
   * Handle PDF upload and processing
   */
  async uploadPDF(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const startTime = Date.now();
    let filePath: string | undefined;

    try {
      // Validate file
      validateFile(req.file);
      filePath = req.file!.path;
      const filename = req.file!.originalname;

      console.log(`Processing file: ${filename}`);

      // Step 1: Extract text from PDF
      console.log('Step 1: Extracting text from PDF...');
      const text = await pdfService.extractTextFromPDF(filePath);
      console.log(`Extracted ${text.length} characters`);

      // Step 2: Chunk the text
      console.log('Step 2: Chunking text...');
      const chunks = chunkingService.chunkText(text, filename);
      console.log(`Created ${chunks.length} chunks`);

      if (chunks.length === 0) {
        throw new Error('No text chunks created from PDF');
      }

      // Step 3: Generate embeddings
      console.log('Step 3: Generating embeddings...');
      const embeddings = await embeddingService.generateEmbeddings(chunks);
      console.log(`Generated ${embeddings.length} embeddings`);

      // Step 4: Upsert to Pinecone
      console.log('Step 4: Upserting to Pinecone...');
      const vectorsUpserted = await vectorService.upsertVectors(embeddings);
      console.log(`Upserted ${vectorsUpserted} vectors`);

      // Calculate processing time
      const processingTimeMs = Date.now() - startTime;

      // Send success response
      const response: UploadResponse = {
        success: true,
        message: 'PDF processed successfully',
        data: {
          filename,
          chunksProcessed: chunks.length,
          vectorsUpserted,
          processingTimeMs,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      // Pass error to error handler middleware
      next(error);
    } finally {
      // Cleanup: Delete uploaded file
      if (filePath) {
        await pdfService.cleanupFile(filePath);
      }
    }
  }
}

export default new UploadController();
