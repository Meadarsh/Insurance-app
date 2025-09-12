import express from 'express';
import multer from 'multer';
import { sendEmail } from '../controllers/email.controller.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
});

// POST /api/email/send - Send email with PDF attachment
router.post('/send', upload.single('pdf'), sendEmail);

// Error handling middleware for multer
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      status: 'error',
      message: 'File upload error: ' + err.message,
    });
  } else if (err) {
    return res.status(400).json({
      status: 'error',
      message: err.message || 'Error uploading file',
    });
  }
  next();
});

export default router;
