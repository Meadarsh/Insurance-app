import express from 'express';
import multer from 'multer';
import {
  createVendor,
  getVendors,
  getVendorById,
  updateVendor,
  deleteVendor,
  uploadVendors,
  searchVendors
} from '../controllers/vendor.controller.js';
import protect from '../middleware/auth.js';

const router = express.Router();

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || 
        file.mimetype === 'text/csv' || 
        file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  }
});

// Vendor routes - Protected with authentication
router.post('/', protect, createVendor);
router.get('/', protect, getVendors);
router.get('/search', protect, searchVendors);
router.get('/:id', protect, getVendorById);
router.put('/:id', protect, updateVendor);
router.delete('/:id', protect, deleteVendor);

// CSV Upload route - Protected
router.post('/upload', protect, upload.single('file'), uploadVendors);

export default router;
