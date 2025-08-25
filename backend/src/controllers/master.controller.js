// controllers/master.controller.js
import fs from "fs";
import csv from "csv-parser";
import Master from "../models/master.model.js";
import Company from "../models/company.model.js";

const extractCompanyFromName = (originalName, marker = "rate") => {
  const s = String(originalName || "").toLowerCase();
  const parts = s.split(marker);
  const raw = (parts[0] || s).replace(/\.[^.]+$/, ""); 
  return raw.replace(/[^a-z0-9]+/g, "").trim() || "unknowncompany";
};

const parsePPT = (raw) => {
  const s = String(raw ?? "").trim();
  if (!s) return { min: 0, max: 0 };

  // 11+ or "11 +"
  if (/^\d+\s*\+$/.test(s)) {
    const n = parseInt(s, 10);
    return { min: isNaN(n) ? 0 : n, max: null };
  }

  // range like "10-12"
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

// 📌 Upload & save Master CSV (supports PPT 11+ / ranges)
export const uploadMasterCSV = async (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, error: "Please upload a CSV file" });
  }

  const results = [];

  try {
    // derive company name from file name (e.g., "companyArate.csv")
    const companyName = extractCompanyFromName(req.file.originalname, "rate");

    // ensure company exists (per user)
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

    // process csv
    await new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on("data", (row) => {
          try {
            const { min: pptMin, max: pptMax } = parsePPT(
              row["Premium Paying Term"]
            );

            const masterData = {
              company: company._id,
              productName: row["Product Name"] || "",
              productVariant: row["Product Variant"] || "",

              // store as range
              premiumPayingTermMin: pptMin,
              premiumPayingTermMax: pptMax, // null = open-ended (e.g., 11+)

              policyTerm: Number(row["Policy Term"] || 0),
              policyNumber: row["Policy Number"] || "",

              totalRate: pct(row["Total Rate"]),
              commission: pct(row["Commission"]),
              reward: pct(row["Reward"]),
            };

            results.push(masterData);
          } catch (err) {
            // swallow bad row but continue
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

    const inserted = await Master.insertMany(results);

    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path); // cleanup

    res.status(201).json({
      success: true,
      company: company.name,
      count: inserted.length,
    });
  } catch (error) {
    console.error(error);
    if (req.file?.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch {}
    }
    res.status(500).json({ success: false, error: error.message });
  }
};

// 📌 Get all master rows for a company (optional but handy for debugging/audit)
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
    res.json({ success: true, count: masters.length, data: masters });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
