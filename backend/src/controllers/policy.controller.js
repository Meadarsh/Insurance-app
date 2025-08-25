// controllers/policy.controller.js
import mongoose from "mongoose";
import csvParser from "csv-parser";
import { Readable } from "stream";

import Policy from "../models/policy.model.js";
import Master from "../models/master.model.js";
import Company from "../models/company.model.js";

/** ---------- helpers ---------- */

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

/** ---------- controllers ---------- */

/**
 * Upload business (policy) CSV
 * Overwrite-on-upload:
 *  - wipe existing policies for the company
 *  - insert enriched rows
 *  - SET company totals from this batch (policies, premium, commission, reward, profit)
 */
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

    // Find company for the current user
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

    // Load master rules (with PPT min/max fields)
    const masterData = await Master.find({ company: company._id });
    if (!masterData || masterData.length === 0) {
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
    const enriched = [];

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
        matchedMasterId: master._id, // optional; add field in Policy model if you want this reference
      });
    }

    // If nothing matched, return gracefully
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
    const session = await mongoose.startSession();
    await session.withTransaction(async () => {
      await Policy.deleteMany({ company: company._id }, { session });
      await Policy.insertMany(enriched, { session });

      await Company.updateOne(
        { _id: company._id, createdBy: req.user._id },
        {
          $set: {
            "totals.policies": batchTotals.policies,
            "totals.premium": batchTotals.premium,
            "totals.commission": batchTotals.commission,
            "totals.reward": batchTotals.reward,
            "totals.profit": batchTotals.profit,
            lastTotalsAt: new Date(),
          },
        },
        { session }
      );
    });
    session.endSession();

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

/**
 * Get all policies of a company with pagination
 */
export const getPolicies = async (req, res) => {
  try {
    const { companyId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [policies, total] = await Promise.all([
      Policy.find({ company: companyId })
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Policy.countDocuments({ company: companyId }),
    ]);

    res.json({
      data: policies,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/**
 * Get stats for a company (by product)
 */
export const getPolicyStats = async (req, res) => {
  try {
    const { companyId } = req.params;

    const stats = await Policy.aggregate([
      { $match: { company: new mongoose.Types.ObjectId(companyId) } },
      {
        $group: {
          _id: "$productName",
          count: { $sum: 1 },
          totalPremium: { $sum: "$netPremium" },
          totalProfit: { $sum: "$totalProfit" },
        },
      },
      {
        $project: {
          product: "$_id",
          count: 1,
          totalPremium: 1,
          totalProfit: 1,
          averagePremium: { $divide: ["$totalPremium", "$count"] },
        },
      },
      { $sort: { count: -1 } },
    ]);

    return res.json(stats);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
