import express from "express";
import {
  getCompanySummary,
  getMonthlyBreakdown,
} from "../controllers/analytics.controller.js";
import protect from "../middleware/auth.js";
import { getCompanies } from "../controllers/company.controller.js";

const router = express.Router();

// Get summary for single or multiple companies
// POST /api/analytics/company with body: { companyIds: ["id1", "id2"] }
// or GET /api/analytics/company/:companyId
router.post("/company", protect, getCompanies);
router.get("/company/:companyId", protect, getCompanySummary);

// Get policies for a specific company
router.get("/company/:companyId/policies", protect, getMonthlyBreakdown);

export default router;
