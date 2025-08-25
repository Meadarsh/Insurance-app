// controllers/policy.controller.js
import mongoose from "mongoose";
import Policy from "../models/policy.model.js";
import Master from "../models/master.model.js";
import Company from "../models/company.model.js";
import csvParser from "csv-parser";
import { Readable } from "stream";


const parseDate = (dateString) => {
  if (!dateString) return null;
  if (dateString.includes("/")) {
    const [month, day, year] = dateString.split("/").map(Number);
    return new Date(year, month - 1, day);
  }
  if (dateString.includes("-")) return new Date(dateString);
  return null;
};

// e.g., "companyAbusiness.csv" -> "companya"
const extractCompanyFromName = (originalName, marker = "business") => {
  const s = String(originalName || "").toLowerCase();
  const parts = s.split(marker);
  const raw = (parts[0] || s).replace(/\.[^.]+$/, ""); // trim extension
  return raw.replace(/[^a-z0-9]+/g, "").trim();
};

export const uploadPolicies = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Derive company from filename
    const companyName = extractCompanyFromName(
      req.file.originalname,
      "business"
    );
    if (!companyName) {
      return res
        .status(400)
        .json({ message: "Could not derive company from filename" });
    }

    // Find company belonging to user
    const company = await Company.findOne({
      name: companyName,
      createdBy: req.user._id,
    });
    if (!company) {
      return res.status(404).json({
        message: `Company ${companyName} not found. Upload master first.`,
      });
    }

    // Load master rules for this company (with PPT min/max)
    const masterData = await Master.find({ company: company._id });
    if (!masterData || masterData.length === 0) {
      return res
        .status(404)
        .json({ message: "No master rules found for this company" });
    }

    // Parse CSV rows
    const rows = [];
    const readableStream = new Readable();
    readableStream.push(req.file.buffer);
    readableStream.push(null);

    await new Promise((resolve, reject) => {
      readableStream
        .pipe(csvParser())
        .on("data", (data) => {
          rows.push({
            company: company._id,
            productName: data["Product Name"]?.trim(),
            productVariant: data["Product Variant"]?.trim(),
            premiumPayingTerm: Number(data["Premium Paying Term"] || 0),
            policyTerm: Number(data["Policy Term"] || 0),
            policyNo: data["Policy No"],
            netPremium: Number(data["Net Premium"] || 0),
            sumAssured: Number(data["Sum Assured"] || 0),
            transactionDate: parseDate(data["Transaction Date"]),
            cancellationDate: parseDate(data["Cancellation Date"]),
            customerName: data["Customer Name"],
            agentName: data["Agent Name"],
          });
        })
        .on("end", resolve)
        .on("error", reject);
    });

    const errors = [];
    const enriched = [];

    // Match + enrich
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
        matchedMasterId: master._id, // optional; remove if you don't want it in the schema
      });
    }

    if (enriched.length > 0) {
      await Policy.insertMany(enriched);
    }

    res.json({
      message: "Policies uploaded successfully",
      totalProcessed: enriched.length,
      totalErrors: errors.length,
      errors,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res
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

    const policies = await Policy.find({ company: companyId })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Policy.countDocuments({ company: companyId });

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
    res.status(500).json({ message: error.message });
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

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
