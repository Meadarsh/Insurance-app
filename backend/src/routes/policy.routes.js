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

// Policy routes
router.post('/', createPolicy);
router.get('/', getPolicies);
router.get('/search', searchPolicies);
router.get('/stats', getPolicyStats);
router.get('/:id', getPolicyById);
router.put('/:id', updatePolicy);
router.delete('/:id', deletePolicy);

// CSV Upload route
router.post('/upload', upload.single('file'), uploadPolicies);

export default router;
