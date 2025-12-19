import { ValidationError } from './errors';
import path from 'path';

export const validateFile = (file: Express.Multer.File | undefined): void => {
  if (!file) {
    throw new ValidationError('No file uploaded');
  }

  // Check file extension
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext !== '.pdf') {
    throw new ValidationError('Only PDF files are allowed');
  }

  // Check MIME type
  if (file.mimetype !== 'application/pdf') {
    throw new ValidationError('Invalid file type. Must be application/pdf');
  }
};

export const sanitizeFilename = (filename: string): string => {
  // Remove any path components and dangerous characters
  return filename
    .replace(/^.*[\\\/]/, '') // Remove path
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace special chars with underscore
    .substring(0, 255); // Limit length
};
