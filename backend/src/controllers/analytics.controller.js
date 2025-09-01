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
    const { companyId } = req.params;

    // verify company belongs to user
    const company = await Company.findOne({
      _id: companyId,
      createdBy: req.user._id,
    })
      .select("_id name")
      .lean();

    if (!company) {
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

    const match = {
      company: new mongoose.Types.ObjectId(companyId),
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
      company: { id: company._id, name: company.name },
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

/**
 * Monthly breakdown for charts (single year only)
 * GET /api/analytics/company/:companyId/monthly?year=2025
 * (always returns the 12 months present for that year; frontend can still
 * slice to a sub-range if user picked mStart/mEnd)
 */
export const getMonthlyBreakdown = async (req, res) => {
  try {
    const { companyId } = req.params;
    const year = Number(req.query.year);

    if (!inRange(year, 1970, 3000)) {
      return res
        .status(400)
        .json({ success: false, message: "Valid 'year' is required" });
    }

    const match = {
      company: new mongoose.Types.ObjectId(companyId),
      originalIssueYear: year,
    };

    const data = await Policy.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$originalIssueMonth",
          policies: { $sum: 1 },
          premium: { $sum: "$netPremium" },
          commission: { $sum: "$commissionAmount" },
          reward: { $sum: "$rewardAmount" },
          profit: { $sum: "$totalProfit" },
        },
      },
      {
        $project: {
          month: "$_id",
          _id: 0,
          policies: 1,
          premium: 1,
          commission: 1,
          reward: 1,
          profit: 1,
        },
      },
      { $sort: { month: 1 } },
    ]);

    return res.json({ success: true, year, data });
  } catch (err) {
    console.error("getMonthlyBreakdown error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
