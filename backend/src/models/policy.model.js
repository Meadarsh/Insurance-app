import mongoose from "mongoose";
// Business file
const policySchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    // business file data
    productName: String,
    productVariant: String,
    premiumPayingTerm: Number,
    policyTerm: Number,
    policyNo: String,
    netPremium: Number,

    // enriched from master
    commissionPct: Number,
    rewardPct: Number,
    totalRatePct: Number,
    commissionAmount: Number,
    rewardAmount: Number,
    totalProfit: Number,
  },
  { timestamps: true }
);

export default mongoose.model("Policy", policySchema);
