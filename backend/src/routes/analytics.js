import express from "express";
import {
  getCompanySummary,
  listCompanyPolicies,
} from "../controllers/analytics.controller.js";
import protect from "../middleware/auth.js";

const router = express.Router();

// Get summary for single or multiple companies
// POST /api/analytics/company with body: { companyIds: ["id1", "id2"] }
// or GET /api/analytics/company/:companyId
router.post("/company", protect, getCompanySummary);
router.get("/company/:companyId", protect, getCompanySummary);

// Get policies for a specific company
router.get("/company/:companyId/policies", protect, listCompanyPolicies);

export default router;
