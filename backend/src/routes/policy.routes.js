import express from "express";
import multer from "multer";
import protect from "../middleware/auth.js";
import {
  uploadPolicies,
  getPolicies,
} from "../controllers/policy.controller.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const ok =
      file.mimetype === "text/csv" ||
      file.mimetype === "application/vnd.ms-excel" ||
      /\.csv$/i.test(file.originalname);
    if (!ok) return cb(new Error("Only CSV files are allowed"));
    cb(null, true);
  },
});

router.post("/upload", protect, upload.single("file"), uploadPolicies);
router.post("/get", protect, getPolicies);

router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message?.includes("CSV")) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next(err);
});

export default router;
