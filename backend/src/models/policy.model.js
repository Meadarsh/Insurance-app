// models/policy.model.js
import mongoose from "mongoose";

const policySchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    // Business file columns (only the ones you actually use downstream)
    productName: { type: String, trim: true },
    productVariant: { type: String, trim: true },

    premiumPayingTerm: Number,
    policyTerm: Number,

    policyNo: { type: String, trim: true, index: true },

    // IMPORTANT for dedupe + querying by period
    originalIssueDate: { type: Date, required: true, index: true },
    // convenience denormalized keys for fast filtering
    originalIssueYear: { type: Number, index: true },
    originalIssueMonth: { type: Number, index: true }, // 1..12

    netPremium: { type: Number, default: 0 },
    sumAssured: { type: Number, default: 0 },

    // rates from master
    commissionPct: { type: Number, default: 0 },
    rewardPct: { type: Number, default: 0 },
    totalRatePct: { type: Number, default: 0 },

    // money derived from master * netPremium
    commissionAmount: { type: Number, default: 0 },
    rewardAmount: { type: Number, default: 0 },
    totalProfit: { type: Number, default: 0 },

    matchedMasterId: { type: mongoose.Schema.Types.ObjectId, ref: "Master" },
  },
  { timestamps: true }
);

// unique “natural key” to dedupe: same company + policy + originalIssueDate
policySchema.index(
  { company: 1, policyNo: 1, originalIssueDate: 1 },
  { unique: true }
);

export default mongoose.model("Policy", policySchema);
