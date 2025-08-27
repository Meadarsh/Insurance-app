import express from "express";
import protect from "../middleware/auth.js";
import {
  deleteCompany,
  getCompanies,
} from "../controllers/company.controller.js";

const router = express.Router();

router.get("/get", protect, getCompanies);
router.delete("/delete/:id", protect, deleteCompany);

export default router;
