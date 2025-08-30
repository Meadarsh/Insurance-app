import mongoose from "mongoose";
import Company from "../models/company.model.js";
import Policy from "../models/policy.model.js";

export const getCompanySummary = async (req, res) => {
  try {
    // Get company IDs from either request body (for POST) or params (for GET)
    let companyIds = [];
    
    if (req.method === 'POST' && req.body.companyIds) {
      // Handle array of company IDs from request body
      companyIds = Array.isArray(req.body.companyIds) 
        ? req.body.companyIds 
        : [req.body.companyIds];
    } else if (req.params.companyId) {
      // Handle single company ID from URL parameter
      companyIds = [req.params.companyId];
    } else {
      return res.status(400).json({
        success: false,
        message: 'No company IDs provided. Use POST /company with {companyIds: [...]} or GET /company/:companyId',
      });
    }

    // Validate all company IDs
    const invalidIds = companyIds.filter(id => !mongoose.isValidObjectId(id));
    if (invalidIds.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid company ID(s): ${invalidIds.join(', ')}`,
      });
    }

    // Find companies
    const companies = await Company.find({
      _id: { $in: companyIds },
      createdBy: req.user._id,
    })
      .select("_id name totals lastTotalsAt updatedAt createdAt")
      .lean();

    if (companies.length === 0) {
      return res.status(404).json({
        success: false,
        message: companyIds.length === 1 ? "Company not found" : "No companies found",
      });
    }

    // Initialize aggregated totals
    const aggregatedTotals = {
      policies: 0,
      premium: 0,
      commission: 0,
      reward: 0,
      profit: 0,
    };

    // Process and aggregate companies data
    const companiesData = companies.map(company => {
      const t = company.totals || {
        policies: 0,
        premium: 0,
        commission: 0,
        reward: 0,
        profit: 0,
      };

      // Add to aggregated totals
      aggregatedTotals.policies += t.policies || 0;
      aggregatedTotals.premium += t.premium || 0;
      aggregatedTotals.commission += t.commission || 0;
      aggregatedTotals.reward += t.reward || 0;
      aggregatedTotals.profit += t.profit || 0;

      return {
        company: {
          id: company._id,
          name: company.name,
        },
        totals: {
          policies: t.policies || 0,
          premium: t.premium || 0,
          commission: t.commission || 0,
          reward: t.reward || 0,
          profit: t.profit || 0,
        },
        lastUpdated: company.lastTotalsAt || company.updatedAt,
      };
    });

    // Find the most recent update time
    const lastUpdated = Math.max(
      ...companies.map(c => 
        (c.lastTotalsAt || c.updatedAt).getTime()
      )
    );

    return res.json({
      success: true,
      data: {
        companies: companiesData,
        totals: aggregatedTotals,
        companyCount: companies.length,
        lastUpdated: new Date(lastUpdated),
      },
    });
  } catch (err) {
    console.error("getCompanySummary error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
//pagination needs to be handled by frontend (Adarsh please take care )
export const listCompanyPolicies = async (req, res) => {
  try {
    const { companyId } = req.params;

    if (!mongoose.isValidObjectId(companyId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid company id" });
    }

    // simple ownership guard
    const companyExists = await Company.exists({
      _id: companyId,
      createdBy: req.user._id,
    });
    if (!companyExists) {
      return res
        .status(404)
        .json({ success: false, message: "Company not found" });
    }

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 200);
    const skip = (page - 1) * limit;
    const search = (req.query.search || "").trim();
    const sort = buildSort(req.query.sort || "-createdAt");

    const match = { company: new mongoose.Types.ObjectId(companyId) };
    if (search) {
      match.$or = [
        { policyNo: { $regex: search, $options: "i" } },
        { productName: { $regex: search, $options: "i" } },
        { productVariant: { $regex: search, $options: "i" } },
      ];
    }

    // **Key trick**: fetch limit+1 items to detect if there's a next page
    const limitPlusOne = limit + 1;

    const rows = await Policy.find(match)
      .sort(sort)
      .skip(skip)
      .limit(limitPlusOne)
      .select(
        "productName policyNo premiumPayingTerm netPremium totalProfit commissionAmount commissionPct rewardAmount rewardPct totalRatePct policyTerm productVariant createdAt"
      )
      .lean();

    const hasNext = rows.length > limit;
    const trimmed = hasNext ? rows.slice(0, limit) : rows;

    return res.json({
      success: true,
      data: trimmed.map((p) => ({
        policyName: p.productName,
        policyNumber: p.policyNo,
        ppt: p.premiumPayingTerm,
        netPrice: p.netPremium,
        totalProfitAmount: p.totalProfit,
        totalRatePct: p.totalRatePct,
        commissionAmount: p.commissionAmount,
        commissionPct: p.commissionPct,
        rewardAmount: p.rewardAmount,
        rewardPct: p.rewardPct,
        policyTerm: p.policyTerm,
        variant: p.productVariant,
        createdAt: p.createdAt,
      })),
      pageInfo: {
        page,
        limit,
        hasNext,
        nextPage: hasNext ? page + 1 : null,
      },
    });
  } catch (err) {
    console.error("listCompanyPolicies error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};


const listMasterData = async (req, res) => {};
