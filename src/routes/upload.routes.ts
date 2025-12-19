import { Router } from 'express';
import { upload } from '../middleware/upload.middleware';
import uploadController from '../controllers/upload.controller';

const router = Router();

/**
 * POST /api/upload
 * Upload and process a PDF file
 */
router.post('/upload', upload.single('file'), (req, res, next) => {
  uploadController.uploadPDF(req, res, next);
});

export default router;
