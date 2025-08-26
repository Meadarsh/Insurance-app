import express from "express";
import {
  getCompanySummary,
  listCompanyPolicies,
} from "../controllers/analytics.controller.js";
import protect from "../middleware/auth.js";

const router = express.Router();

router.get("/company/:companyId", protect, getCompanySummary);
router.get("/company/:companyId/policies", protect, listCompanyPolicies);

export default router;
