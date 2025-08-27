import mongoose from "mongoose";
import Company from "../models/company.model.js";
import Policy from "../models/policy.model.js";

export const getCompanySummary = async (req, res) => {
  try {
    const { companyId } = req.params;

    if (!mongoose.isValidObjectId(companyId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid company id" });
    }

    const company = await Company.findOne({
      _id: companyId,
      createdBy: req.user._id,
    })
      .select("_id name totals lastTotalsAt updatedAt createdAt")
      .lean();

    if (!company) {
      return res
        .status(404)
        .json({ success: false, message: "Company not found" });
    }

    const t = company.totals || {
      policies: 0,
      premium: 0,
      commission: 0,
      reward: 0,
      profit: 0,
    };

    return res.json({
      success: true,
      company: {
        id: company._id,
        name: company.name,
      },
      totals: {
        policies: t.policies,
        premium: t.premium,
        commission: t.commission,
        reward: t.reward,
        profit: t.profit,
      },
      lastTotalsAt: company.lastTotalsAt || null,
      updatedAt: company.updatedAt,
      createdAt: company.createdAt,
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

function buildSort(sortStr) {
  const s = String(sortStr || "").trim();
  if (!s) return { createdAt: -1 };
  const dir = s.startsWith("-") ? -1 : 1;
  const field = s.replace(/^-/, "");
  return { [field]: dir };
}
const listMasterData = async (req, res) => {};
