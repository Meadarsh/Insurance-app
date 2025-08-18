import express from 'express';
import { createMaster, getMasters, getMaster, updateMaster, deleteMaster, uploadCSV } from '../controllers/master.controller.js';
import protect from '../middleware/auth.js';
import multer from 'multer';

const router = express.Router();

// Configure multer for file upload
const upload = multer({ dest: 'uploads/' });

router.get('/get', protect, getMasters);
router.post('/create', protect, createMaster);
router.post('/upload-csv', protect, upload.single('file'), uploadCSV);
router.put('/update/:id', protect, updateMaster);
router.delete('/delete/:id', protect, deleteMaster);
router.get('/get/:id', protect, getMaster);


export default router;
