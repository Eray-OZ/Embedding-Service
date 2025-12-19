import pdfParse from 'pdf-parse';
import fs from 'fs/promises';
import { PDFProcessingError } from '../utils/errors';

export class PDFService {
  /**
   * Extract text content from a PDF file
   * @param filePath - Absolute path to the PDF file
   * @returns Extracted text content
   */
  async extractTextFromPDF(filePath: string): Promise<string> {
    try {
      // Read the PDF file
      const dataBuffer = await fs.readFile(filePath);

      // Parse PDF
      const data = await pdfParse(dataBuffer);

      if (!data.text || data.text.trim().length === 0) {
        throw new PDFProcessingError('PDF contains no extractable text');
      }

      return data.text;
    } catch (error) {
      if (error instanceof PDFProcessingError) {
        throw error;
      }

      throw new PDFProcessingError(
        `Failed to extract text from PDF: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Clean up temporary file
   * @param filePath - Path to the file to delete
   */
  async cleanupFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error(`Failed to delete file ${filePath}:`, error);
      // Don't throw - cleanup failures shouldn't break the flow
    }
  }
}

export default new PDFService();
