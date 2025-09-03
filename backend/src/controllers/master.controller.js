// controllers/master.controller.js
import fs from "fs";
import csv from "csv-parser";
import mongoose from "mongoose";

import Master from "../models/master.model.js";
import Policy from "../models/policy.model.js";
import Company from "../models/company.model.js";

/** -------- helpers -------- */

const extractCompanyFromName = (originalName, marker = "rate") => {
  const s = String(originalName || "").toLowerCase();
  const parts = s.split(marker);
  const raw = (parts[0] || s).replace(/\.[^.]+$/, ""); // drop extension
  return raw.replace(/[^a-z0-9]+/g, "").trim() || "unknowncompany";
};

// Accepts: "11+", "10-12", "10 - 12", "10", "5 to 12"
const parsePPT = (raw) => {
  const s = String(raw ?? "").trim();
  if (!s) return { min: 0, max: 0 };

  // 11+ (open-ended)
  if (/^\d+\s*\+$/.test(s)) {
    const n = parseInt(s, 10);
    return { min: isNaN(n) ? 0 : n, max: null };
  }

  // range "10-12" or "10 to 12"
  const compact = s.replace(/\s+/g, "");
  const hyphen = compact.match(/^(\d+)-(\d+)$/);
  if (hyphen) {
    const a = parseInt(hyphen[1], 10);
    const b = parseInt(hyphen[2], 10);
    return { min: Math.min(a, b), max: Math.max(a, b) };
  }
  const toMatch = s.match(/^(\d+)\s*to\s*(\d+)$/i);
  if (toMatch) {
    const a = parseInt(toMatch[1], 10);
    const b = parseInt(toMatch[2], 10);
    return { min: Math.min(a, b), max: Math.max(a, b) };
  }

  // single number
  const n = parseInt(s, 10);
  return { min: isNaN(n) ? 0 : n, max: isNaN(n) ? 0 : n };
};

// Percent parser -> returns FRACTION in [0, 1].
// "5%" -> 0.05; "5" -> 0.05; "0.05" -> 0.05; invalid -> 0
const pct = (v) => {
  if (v == null) return 0;
  const s = String(v).trim();
  if (!s) return 0;
  if (/%$/.test(s)) {
    const num = parseFloat(s.replace(/%$/, ""));
    return isNaN(num) ? 0 : num / 100;
  }
  const num = parseFloat(s);
  if (isNaN(num)) return 0;
  return num > 1 ? num / 100 : num;
};

const normalizeHeader = (h) => (h ?? "").toLowerCase().replace(/\s+/g, "");

// Map common variants to canonical keys used below
const headerAliases = {
  premiumpayingterm: "premiumpayingterm",
  productname: "productname",
  productvariant: "productvariant",
  policyterm: "policyterm",
  policynumber: "policynumber",
  totalrate: "totalrate",
  commission: "commission",
  reward: "reward",
  totalreward: "reward", // alias "Total Reward" → reward
  vli: "vli",

  // extra variants you might encounter
  policyno: "policynumber",
  policy_no: "policynumber",
  product: "productname",
};

/** -------- controllers -------- */

// 📌 Upload & save Master CSV (supports PPT open-ended/ranges). Overwrites previous company data.
export const uploadMasterCSV = async (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, error: "Please upload a CSV file" });
  }

  const results = [];
  const USE_TX = process.env.USE_TRANSACTIONS === "true";

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
        .pipe(
          csv({
            mapHeaders: ({ header }) => {
              const norm = normalizeHeader(header);
              return headerAliases[norm] || norm;
            },
            mapValues: ({ value }) =>
              typeof value === "string" ? value.trim() : value,
          })
        )
        .on("data", (row) => {
          try {
            const { min: pptMin, max: pptMax } = parsePPT(
              row["premiumpayingterm"]
            );

            results.push({
              company: company._id,
              productName: row["productname"] || "",
              productVariant: row["productvariant"] || "",
              premiumPayingTermMin: pptMin,
              premiumPayingTermMax: pptMax, // null = open-ended
              policyTerm: Number(row["policyterm"] || 0),
              policyNumber: row["policynumber"] || "",
              totalRate: pct(row["totalrate"]),
              commission: pct(row["commission"]),
              reward: pct(row["reward"]), // covers "Total Reward" via alias
              vli: pct(row["vli"]), // e.g., "5%" -> 0.05
            });
          } catch (err) {
            console.error("Row parse error:", err, { row });
          }
        })
        .on("end", resolve)
        .on("error", reject);
    });

    if (results.length === 0) {
      return res
        .status(400)
        .json({ success: false, error: "CSV had no valid rows" });
    }

    // ----- OVERWRITE-ON-UPLOAD -----
    if (USE_TX) {
      const session = await mongoose.startSession();
      try {
        await session.withTransaction(async () => {
          await Master.deleteMany({ company: company._id }, { session });
          await Policy.deleteMany({ company: company._id }, { session });
          await Company.updateOne(
            { _id: company._id, createdBy: req.user._id },
            {
              $set: {
                "totals.policies": 0,
                "totals.premium": 0,
                "totals.commission": 0,
                "totals.vli": 0,
                "totals.reward": 0,
                "totals.profit": 0,
                lastTotalsAt: new Date(),
              },
            },
            { session }
          );
          await Master.insertMany(results, { session });
        });
      } finally {
        await session.endSession();
      }
    } else {
      await Master.deleteMany({ company: company._id });
      await Policy.deleteMany({ company: company._id });
      await Company.updateOne(
        { _id: company._id, createdBy: req.user._id },
        {
          $set: {
            "totals.policies": 0,
            "totals.premium": 0,
            "totals.commission": 0,
            "totals.vli": 0,
            "totals.reward": 0,
            "totals.profit": 0,
            lastTotalsAt: new Date(),
          },
        }
      );
      await Master.insertMany(results);
    }

    return res.status(201).json({
      success: true,
      company: company.name,
      count: results.length,
      message:
        "Master uploaded successfully; previous company data was replaced.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: error.message });
  } finally {
    // cleanup temp file if present
    try {
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    } catch {}
  }
};

// 📌 List masters (with pagination). Optional filters: ?company=<id>&createdBy=<userId>
export const getCompanyMasters = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.company) filter.company = req.query.company;
    if (req.query.createdBy) filter.createdBy = req.query.createdBy;

    const total = await Master.countDocuments(filter);
    const masters = await Master.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(total / limit);

    return res.json({
      success: true,
      data: masters,
      pagination: {
        total,
        totalPages,
        currentPage: page,
        limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
};
