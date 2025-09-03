// controllers/policy.controller.js
import mongoose from "mongoose";
import csvParser from "csv-parser";
import { Readable } from "stream";

import Policy from "../models/policy.model.js";
import Master from "../models/master.model.js";
import Company from "../models/company.model.js";

/** -------- helpers -------- */

const parseDate = (val) => {
  if (!val) return null;
  const s = String(val).trim();
  if (!s) return null;

  // Try DD-MM-YY / DD-MM-YYYY
  if (/^\d{2}-\d{2}-\d{2,4}$/.test(s)) {
    const [dd, mm, yy] = s.split("-").map((n) => Number(n));
    const yyyy = yy < 100 ? 2000 + yy : yy;
    const d = new Date(yyyy, (mm || 1) - 1, dd || 1);
    return isNaN(d.getTime()) ? null : d;
  }

  // Try MM/DD/YYYY
  if (s.includes("/")) {
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }

  // Fallback ISO-like
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
};

const extractCompanyFromName = (originalName, marker = "business") => {
  const s = String(originalName || "").toLowerCase();
  const parts = s.split(marker);
  const raw = (parts[0] || s).replace(/\.[^.]+$/, "");
  return raw.replace(/[^a-z0-9]+/gi, "").trim();
};

/** -------- upload (append-only, dedupe) -------- */
export const uploadPolicies = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }

    const companyName = extractCompanyFromName(
      req.file.originalname,
      "business"
    );
    if (!companyName) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Cannot derive company from filename",
        });
    }

    const company = await Company.findOne({
      name: companyName,
      createdBy: req.user._id,
    });
    if (!company) {
      return res.status(404).json({
        success: false,
        message: `Company '${companyName}' not found. Upload master first.`,
      });
    }

    const masters = await Master.find({ company: company._id });
    if (!masters.length) {
      return res
        .status(404)
        .json({ success: false, message: "No master rules for this company" });
    }

    // Parse CSV
    const rows = [];
    const readable = new Readable();
    readable.push(req.file.buffer);
    readable.push(null);

    await new Promise((resolve, reject) => {
      readable
        .pipe(csvParser())
        .on("data", (r) => rows.push(r))
        .on("end", resolve)
        .on("error", reject);
    });

    if (!rows.length) {
      return res
        .status(400)
        .json({ success: false, message: "CSV contains no rows" });
    }

    const errors = [];
    const ops = [];
    const newDocs = []; // keep actual docs for totals

    for (const raw of rows) {
      const productName = (raw["Product Name"] || "").trim();
      const productVariant = (raw["Product Variant"] || "").trim();

      const ppt = Number(raw["Premium Paying Term"] || 0);
      const pt = Number(raw["Policy Term"] || 0);

      const policyNo = raw["Policy No"] ? String(raw["Policy No"]).trim() : "";
      const oid = parseDate(raw["Original Issue Date"]);
      if (!policyNo || !oid) {
        errors.push({
          policyNo: policyNo || "(empty)",
          error: "Missing Policy No or Original Issue Date",
        });
        continue;
      }

      const master = masters.find((m) => {
        const nameOk =
          (m.productName || "").trim().toLowerCase() ===
          productName.toLowerCase();
        const variantOk =
          (m.productVariant || "").trim().toLowerCase() ===
          productVariant.toLowerCase();
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
        errors.push({ policyNo, error: "No matching master rule" });
        continue;
      }

      const netPremium = Number(raw["Net Premium"] || 0);
      const sumAssured = Number(raw["Sum Assured"] || 0);

      const commissionPct = Number(master.commission || 0);
      const rewardPct = Number(master.reward || 0);
      const totalRatePct = Number(master.totalRate || 0);

      const commissionAmount = (netPremium * commissionPct) / 100;
      const rewardAmount = (netPremium * rewardPct) / 100;
      const totalProfit = commissionAmount + rewardAmount;

      const year = oid.getUTCFullYear();
      const month = oid.getUTCMonth() + 1;

      const doc = {
        company: company._id,
        productName,
        productVariant,
        premiumPayingTerm: ppt,
        policyTerm: pt,
        policyNo,
        originalIssueDate: oid,
        originalIssueYear: year,
        originalIssueMonth: month,
        netPremium,
        sumAssured,
        commissionPct,
        rewardPct,
        totalRatePct,
        commissionAmount,
        rewardAmount,
        totalProfit,
        matchedMasterId: master._id,
      };

      ops.push({
        updateOne: {
          filter: { company: company._id, policyNo, originalIssueDate: oid },
          update: { $setOnInsert: doc },
          upsert: true,
        },
      });
      newDocs.push(doc);
    }

    let inserted = 0;
    if (ops.length) {
      const result = await Policy.bulkWrite(ops, { ordered: false });
      inserted = result?.upsertedCount || 0;

      if (inserted > 0) {
        // recompute totals only for the inserted docs
        const batchTotals = newDocs.slice(-inserted).reduce(
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

        await Company.updateOne(
          { _id: company._id, createdBy: req.user._id },
          {
            $inc: {
              "totals.policies": batchTotals.policies,
              "totals.premium": batchTotals.premium,
              "totals.commission": batchTotals.commission,
              "totals.reward": batchTotals.reward,
              "totals.profit": batchTotals.profit,
            },
            $set: { lastTotalsAt: new Date() },
          }
        );
      }
    }

    return res.json({
      success: true,
      message: "Policies processed (append-only, deduped by policy+date)",
      totalRows: rows.length,
      inserted,
      skippedOrDuplicates: rows.length - inserted - errors.length,
      errorsCount: errors.length,
      errors,
    });
  } catch (err) {
    console.error("uploadPolicies error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/** -------- list policies with filters -------- */
export const getPolicies = async (req, res) => {
  try {
    const { companyIds } = req.body;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 200);
    const skip = (page - 1) * limit;

    const year = req.query.year ? Number(req.query.year) : undefined;
    const mStart = req.query.mStart ? Number(req.query.mStart) : undefined;
    const mEnd = req.query.mEnd ? Number(req.query.mEnd) : undefined;

    const match = { company: { $in: companyIds } };
    if (year && mStart && mEnd) {
      match.originalIssueYear = year;
      match.originalIssueMonth = { $gte: mStart, $lte: mEnd };
    } else if (year) {
      match.originalIssueYear = year;
    }

    const [items, total] = await Promise.all([
      Policy.find(match)
        .sort({ originalIssueDate: -1, _id: -1 })
        .skip(skip)
        .limit(limit),
      Policy.countDocuments(match),
    ]);

    return res.json({
      success: true,
      data: items,
      pagination: { total, page, pages: Math.ceil(total / limit), limit },
    });
  } catch (err) {
    console.error("getPolicies error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
