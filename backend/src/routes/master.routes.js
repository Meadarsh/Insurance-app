import express from "express";
import { uploadCSV } from "../controllers/master.controller.js";
import multer from "multer";
import protect from "../middleware/auth.js";

const router = express.Router();

// Configure multer for file upload
const upload = multer({ dest: "uploads/" });

router.post("/upload-csv", protect, upload.single("file"), uploadCSV);

export default router;
