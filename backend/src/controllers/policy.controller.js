// controllers/policy.controller.js
import mongoose from "mongoose";
import csvParser from "csv-parser";
import { Readable } from "stream";

import Policy from "../models/policy.model.js";
import Master from "../models/master.model.js";
import Company from "../models/company.model.js";

const parseDate = (dateString) => {
  if (!dateString) return null;
  const s = String(dateString).trim();
  if (!s) return null;
  if (s.includes("/")) {
    const [mm, dd, yy] = s.split("/").map(Number);
    const d = new Date(yy, (mm || 1) - 1, dd || 1);
    return isNaN(d.getTime()) ? null : d;
  }
  if (s.includes("-")) {
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
};

// e.g., "companyAbusiness.csv" -> "companya"
const extractCompanyFromName = (originalName, marker = "business") => {
  const s = String(originalName || "").toLowerCase();
  const parts = s.split(marker);
  const raw = (parts[0] || s).replace(/\.[^.]+$/, ""); // drop extension
  return raw.replace(/[^a-z0-9]+/g, "").trim();
};
export const uploadPolicies = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const companyName = extractCompanyFromName(
      req.file.originalname,
      "business"
    );
    if (!companyName) {
      return res
        .status(400)
        .json({ message: "Could not derive company from filename" });
    }

    const company = await Company.findOne({
      name: companyName,
      createdBy: req.user._id,
    });
    if (!company) {
      return res
        .status(404)
        .json({
          message: `Company ${companyName} not found. Upload master first.`,
        });
    }

    const masterData = await Master.find({ company: company._id });
    if (!masterData?.length) {
      return res
        .status(404)
        .json({ message: "No master rules found for this company" });
    }

    // Parse CSV rows from buffer
    const rows = [];
    const readableStream = new Readable();
    readableStream.push(req.file.buffer);
    readableStream.push(null);

    await new Promise((resolve, reject) => {
      readableStream
        .pipe(csvParser())
        .on("data", (data) => {
          const productName = data["Product Name"]
            ? String(data["Product Name"]).trim()
            : "";
          const productVariant = data["Product Variant"]
            ? String(data["Product Variant"]).trim()
            : "";

          rows.push({
            company: company._id,
            productName,
            productVariant,
            premiumPayingTerm: Number(data["Premium Paying Term"] || 0),
            policyTerm: Number(data["Policy Term"] || 0),
            policyNo: data["Policy No"]
              ? String(data["Policy No"]).trim()
              : undefined,
            netPremium: Number(data["Net Premium"] || 0),
            sumAssured: Number(data["Sum Assured"] || 0),
            transactionDate: parseDate(data["Transaction Date"]),
            cancellationDate: parseDate(data["Cancellation Date"]),
            customerName: data["Customer Name"] || undefined,
            agentName: data["Agent Name"] || undefined,
          });
        })
        .on("end", resolve)
        .on("error", reject);
    });

    const errors = [];
    const enriched = []; // ✅ ADD THIS

    // Match against master + compute amounts
    for (const policy of rows) {
      const policyName = (policy.productName || "").toLowerCase();
      const policyVariant = (policy.productVariant || "").toLowerCase();
      const ppt = Number(policy.premiumPayingTerm || 0);
      const pt = Number(policy.policyTerm || 0);

      const master = masterData.find((m) => {
        const nameOk =
          (m.productName || "").trim().toLowerCase() === policyName;
        const variantOk =
          (m.productVariant || "").trim().toLowerCase() === policyVariant;
        const ptOk = Number(m.policyTerm || 0) === pt;

        const min = Number(m.premiumPayingTermMin ?? 0);
        const max =
          m.premiumPayingTermMax == null
            ? null
            : Number(m.premiumPayingTermMax);
        const pptOk = ppt >= min && (max == null || ppt <= max);

        return nameOk && variantOk && ptOk && pptOk;
      });

      if (!master) {
        errors.push({
          policyNo: policy.policyNo,
          error: "No matching master rule",
        });
        continue;
      }

      const commissionPct = Number(master.commission || 0);
      const rewardPct = Number(master.reward || 0);
      const totalRatePct = Number(master.totalRate || 0);

      const commissionAmount = (policy.netPremium * commissionPct) / 100;
      const rewardAmount = (policy.netPremium * rewardPct) / 100;
      const totalProfit = commissionAmount + rewardAmount;

      enriched.push({
        ...policy,
        commissionPct,
        rewardPct,
        totalRatePct,
        commissionAmount,
        rewardAmount,
        totalProfit,
        matchedMasterId: master._id,
      });
    }

    if (enriched.length === 0) {
      return res.json({
        message: "No policies matched master; nothing to insert",
        totalProcessed: 0,
        totalErrors: errors.length,
        errors,
      });
    }

    // Compute batch totals
    const batchTotals = enriched.reduce(
      (acc, p) => {
        acc.policies += 1;
        acc.premium += Number(p.netPremium || 0);
        acc.commission += Number(p.commissionAmount || 0);
        acc.reward += Number(p.rewardAmount || 0);
        acc.profit += Number(p.totalProfit || 0);
        return acc;
      },
      { policies: 0, premium: 0, commission: 0, reward: 0, profit: 0 }
    );

    // Overwrite-on-upload: wipe old policies, insert new, and SET totals
    const totalsUpdate = {
      "totals.policies": batchTotals.policies,
      "totals.premium": batchTotals.premium,
      "totals.commission": batchTotals.commission,
      "totals.reward": batchTotals.reward,
      "totals.profit": batchTotals.profit,
      lastTotalsAt: new Date(),
    };

    const USE_TX = process.env.USE_TRANSACTIONS === "true";

    if (USE_TX) {
      const session = await mongoose.startSession();
      try {
        await session.withTransaction(async () => {
          await Policy.deleteMany({ company: company._id }, { session });
          await Policy.insertMany(enriched, { session });
          await Company.updateOne(
            { _id: company._id, createdBy: req.user._id },
            { $set: totalsUpdate },
            { session }
          );
        });
      } finally {
        await session.endSession();
      }
    } else {
      await Policy.deleteMany({ company: company._id });
      await Policy.insertMany(enriched);
      await Company.updateOne(
        { _id: company._id, createdBy: req.user._id },
        { $set: totalsUpdate }
      );
    }

    return res.json({
      message: "Policies uploaded successfully (replaced previous data)",
      totalProcessed: enriched.length,
      totals: batchTotals,
      totalErrors: errors.length,
      errors,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return res
      .status(500)
      .json({ message: "Error processing file", error: error.message });
  }
};

function buildSort(sortStr) {
  const s = String(sortStr || "").trim();
  if (!s) return { createdAt: -1 };
  const dir = s.startsWith("-") ? -1 : 1;
  const field = s.replace(/^-/, "");
  return { [field]: dir };
}

export const CompanyiesPolicies = async (req, res) => {
  try {
    const { companyIds } = req.body;

    if (!companyIds?.length) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid company id" });
    }

    // simple ownership guard
    const companyExists = await Company.exists({
      _id: { $in: companyIds },
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

    const match = { company: { $in: companyIds } };
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