// controllers/analytics.controller.js
import mongoose from "mongoose";
import Policy from "../models/policy.model.js";
import Company from "../models/company.model.js";

// ---- helpers ----
const toInt = (v) => (v === undefined ? undefined : Number(v));
const inRange = (n, lo, hi) => Number.isInteger(n) && n >= lo && n <= hi;

/**
 * Dashboard summary for a company (single year only)
 * GET /api/analytics/company/:companyId/summary?year=2025
 * GET /api/analytics/company/:companyId/summary?year=2025&mStart=3&mEnd=7
 * (single month => mStart=mEnd)
 */
export const getCompanySummary = async (req, res) => {
  try {
    const { companyIds } = req.body;

    if (!companyIds) {
      return res
        .status(404)
        .json({ success: false, message: "Company not found" });
    }

    // --- inputs: year (required); mStart/mEnd optional ---
    const year = toInt(req.query.year);
    const mStart = toInt(req.query.mStart);
    const mEnd = toInt(req.query.mEnd);

    if (!inRange(year, 1970, 3000)) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Valid 'year' (e.g., 2025) is required",
        });
    }

    // month validations (if provided)
    if (
      (mStart !== undefined && !inRange(mStart, 1, 12)) ||
      (mEnd !== undefined && !inRange(mEnd, 1, 12))
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message: "'mStart'/'mEnd' must be between 1 and 12",
        });
    }
    if (mStart !== undefined && mEnd === undefined) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Provide both 'mStart' and 'mEnd' (or neither)",
        });
    }
    if (mEnd !== undefined && mStart === undefined) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Provide both 'mStart' and 'mEnd' (or neither)",
        });
    }
    if (mStart !== undefined && mEnd !== undefined && mStart > mEnd) {
      return res
        .status(400)
        .json({
          success: false,
          message: "'mStart' cannot be greater than 'mEnd'",
        });
    }

    // Convert string IDs to ObjectId and use $in to match any of the company IDs
    const companyObjectIds = companyIds.map(id => new mongoose.Types.ObjectId(id));
    
    const match = {
      company: { $in: companyObjectIds },
      originalIssueYear: year,
    };

    if (mStart !== undefined && mEnd !== undefined) {
      match.originalIssueMonth = { $gte: mStart, $lte: mEnd };
    }

    const [summary] = await Policy.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          policies: { $sum: 1 },
          premium: { $sum: "$netPremium" },
          commission: { $sum: "$commissionAmount" },
          reward: { $sum: "$rewardAmount" },
          profit: { $sum: "$totalProfit" },
        },
      },
    ]);

    return res.json({
      success: true,
      filter: {
        year,
        mStart: mStart ?? null,
        mEnd: mEnd ?? null,
      },
      totals: summary || {
        policies: 0,
        premium: 0,
        commission: 0,
        reward: 0,
        profit: 0,
      },
    });
  } catch (err) {
    console.error("getCompanySummary error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

