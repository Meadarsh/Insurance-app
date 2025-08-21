import express from 'express';
import multer from 'multer';
import {
  createPolicy,
  getPolicies,
  getPolicyById,
  updatePolicy,
  deletePolicy,
  uploadPolicies,
  searchPolicies,
  getPolicyStats
} from '../controllers/policy.controller.js';
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
        file.mimetype === 'application/vnd.ms-excel' || 
        file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  }
});

// Policy routes - READ operations (no auth required for commission section)
router.get('/get', protect, getPolicies);
router.get('/search', protect, searchPolicies);
router.get('/stats', protect, getPolicyStats);
router.get('/:id', protect, getPolicyById);

// Policy routes - WRITE operations (protected - require authentication)
router.post('/', protect, createPolicy);
router.put('/update/:id', protect, updatePolicy);
router.delete('/delete/:id', protect, deletePolicy);

// CSV Upload route - Protected (require authentication)
router.post('/upload', protect, upload.single('file'), uploadPolicies);

// CSV Upload route for Commission section - No authentication required
router.post('/upload-commission', upload.single('file'), uploadPolicies);

export default router;
