// controllers/master.controller.js
import fs from "fs";
import csv from "csv-parser";
import mongoose from "mongoose";

import Master from "../models/master.model.js";
import Policy from "../models/policy.model.js";
import Company from "../models/company.model.js";

const extractCompanyFromName = (originalName, marker = "rate") => {
  const s = String(originalName || "").toLowerCase();
  const parts = s.split(marker);
  const raw = (parts[0] || s).replace(/\.[^.]+$/, ""); // drop extension
  return raw.replace(/[^a-z0-9]+/g, "").trim() || "unknowncompany";
};

const parsePPT = (raw) => {
  const s = String(raw ?? "").trim();
  if (!s) return { min: 0, max: 0 };

  // 11+ (open-ended)
  if (/^\d+\s*\+$/.test(s)) {
    const n = parseInt(s, 10);
    return { min: isNaN(n) ? 0 : n, max: null };
  }

  // range "10-12"
  if (/^\d+\s*-\s*\d+$/.test(s)) {
    const [a, b] = s.split("-").map((v) => parseInt(v, 10));
    const min = isNaN(a) ? 0 : a;
    const max = isNaN(b) ? min : b;
    return { min, max };
  }

  // single number
  const n = parseInt(s, 10);
  return { min: isNaN(n) ? 0 : n, max: isNaN(n) ? 0 : n };
};

const pct = (v) =>
  Number(
    String(v ?? 0)
      .toString()
      .replace("%", "")
  ) || 0;

/** ---------- controllers ---------- */

// 📌 Upload & save Master CSV (supports PPT 11+ / ranges) with overwrite-on-upload
export const uploadMasterCSV = async (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, error: "Please upload a CSV file" });
  }

  const results = [];

  try {
    // derive company from filename (e.g., "companyArate.csv" -> "companya")
    const companyName = extractCompanyFromName(req.file.originalname, "rate");

    // ensure company exists for this user
    let company = await Company.findOne({
      name: companyName,
      createdBy: req.user._id,
    });
    if (!company) {
      company = await Company.create({
        name: companyName,
        createdBy: req.user._id,
      });
    }

    // parse CSV -> results[]
    await new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on("data", (row) => {
          try {
            const { min: pptMin, max: pptMax } = parsePPT(
              row["Premium Paying Term"]
            );

            results.push({
              company: company._id,
              // model setters will lowercase/trim, but we still guard here
              productName: (row["Product Name"] || "").trim(),
              productVariant: (row["Product Variant"] || "").trim(),

              premiumPayingTermMin: pptMin,
              premiumPayingTermMax: pptMax, // null = open-ended

              policyTerm: Number(row["Policy Term"] || 0),
              policyNumber: row["Policy Number"] || "",

              totalRate: pct(row["Total Rate"]),
              commission: pct(row["Commission"]),
              reward: pct(row["Reward"]),
            });
          } catch (err) {
            console.error("Row parse error:", err);
          }
        })
        .on("end", resolve)
        .on("error", reject);
    });

    if (results.length === 0) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res
        .status(400)
        .json({ success: false, error: "CSV had no valid rows" });
    }

    // OVERWRITE-ON-UPLOAD (atomic)
    const session = await mongoose.startSession();
    await session.withTransaction(async () => {
      // 1) wipe old rules & policies for this company
      await Master.deleteMany({ company: company._id }, { session });
      await Policy.deleteMany({ company: company._id }, { session });

      // 2) reset company totals (homepage)
      await Company.updateOne(
        { _id: company._id, createdBy: req.user._id },
        {
          $set: {
            "totals.policies": 0,
            "totals.premium": 0,
            "totals.commission": 0,
            "totals.reward": 0,
            "totals.profit": 0,
            lastTotalsAt: new Date(),
          },
        },
        { session }
      );

      // 3) insert new master rows
      await Master.insertMany(results, { session });
    });
    session.endSession();

    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path); // cleanup

    return res.status(201).json({
      success: true,
      company: company.name,
      count: results.length,
      message:
        "Master uploaded successfully; previous company data was replaced.",
    });
  } catch (error) {
    console.error(error);
    if (req.file?.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch {}
    }
    return res.status(500).json({ success: false, error: error.message });
  }
};

// 📌 Get all master rows for a company (optional)
export const getCompanyMasters = async (req, res) => {
  try {
    const company = await Company.findOne({
      _id: req.params.companyId,
      createdBy: req.user._id,
    });
    if (!company)
      return res
        .status(404)
        .json({ success: false, error: "Company not found" });

    const masters = await Master.find({ company: company._id }).sort({
      createdAt: -1,
    });
    return res.json({ success: true, count: masters.length, data: masters });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
};
