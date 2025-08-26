import express from "express";
import protect from "../middleware/auth.js";
import { getCompanies } from "../controllers/company.controller.js";

const router = express.Router();

router.get("/get", protect, getCompanies);

export default router;
