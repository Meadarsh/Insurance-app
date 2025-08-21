import express from 'express';
import multer from 'multer';
import {
  uploadFile,
  getFileUploads,
  getFileUploadById,
  updateFileUploadStatus,
  downloadFile
} from '../controllers/fileUpload.controller.js';
import protect from '../middleware/auth.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/files';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    // Accept only specific file types
    const filetypes = /csv|excel|xls|xlsx|pdf|doc|docx/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only .csv, .xls, .xlsx, .pdf, .doc, .docx files are allowed'));
    }
  }
});

// Protected routes (require authentication)
router.use(protect);

// File upload routes
router.route('/')
  .post(upload.single('file'), uploadFile)
  .get(getFileUploads);

router.route('/:id')
  .get(getFileUploadById);

router.route('/:id/status')
  .patch(updateFileUploadStatus);

router.route('/:id/download')
  .get(downloadFile);

export default router;
