import express from 'express';
import { createMaster, getMasters, getMaster, updateMaster, deleteMaster, uploadCSV } from '../controllers/master.controller.js';
import auth from '../middleware/auth.js';
import multer from 'multer';

const router = express.Router();

// Configure multer for file upload
const upload = multer({ dest: 'uploads/' });

// Apply auth middleware to all routes
// router.use(auth);

// Routes
router.route('/')
  .post(createMaster)
  .get(getMasters);

router.route('/upload-csv')
  .post(upload.single('file'), uploadCSV);

router.route('/:id')
  .get(getMaster)
  .put(updateMaster)
  .delete(deleteMaster);

export default router;
