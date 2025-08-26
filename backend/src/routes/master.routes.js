import express from "express";
import { uploadMasterCSV } from "../controllers/master.controller.js";
import multer from "multer";
import protect from "../middleware/auth.js";

const router = express.Router();

// Configure multer for file upload
const upload = multer({ dest: "uploads/" });

router.post("/upload-csv", protect, upload.single("file"), uploadMasterCSV);

export default router;
