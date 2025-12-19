import { Request, Response, NextFunction } from 'express';
import {
  ValidationError,
  PDFProcessingError,
  EmbeddingError,
  VectorStorageError,
} from '../utils/errors';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error('Error:', err);

  // Handle Multer errors
  if (err.message === 'Only PDF files are allowed') {
    return res.status(400).json({
      success: false,
      error: 'Invalid file type',
      message: err.message,
    });
  }

  if (err.message.includes('File too large')) {
    return res.status(400).json({
      success: false,
      error: 'File too large',
      message: 'Maximum file size is 10MB',
    });
  }

  // Handle custom errors
  if (err instanceof ValidationError) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: err.message,
    });
  }

  if (err instanceof PDFProcessingError) {
    return res.status(422).json({
      success: false,
      error: 'PDF Processing Error',
      message: err.message,
    });
  }

  if (err instanceof EmbeddingError) {
    return res.status(500).json({
      success: false,
      error: 'Embedding Generation Error',
      message: err.message,
    });
  }

  if (err instanceof VectorStorageError) {
    return res.status(500).json({
      success: false,
      error: 'Vector Storage Error',
      message: err.message,
    });
  }

  // Default error
  return res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred',
  });
};
