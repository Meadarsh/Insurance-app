// models/company.model.js
import mongoose from "mongoose";

const totalsSchema = new mongoose.Schema(
  {
    policies: { type: Number, default: 0 },
    premium: { type: Number, default: 0 }, // sum of netPremium
    commission: { type: Number, default: 0 },
    reward: { type: Number, default: 0 },
    profit: { type: Number, default: 0 }, // commission + reward
    vli: { type: Number, default: 0 }, // sum of vli from masters
  },
  { _id: false }
);

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    totals: { type: totalsSchema, default: () => ({}) },

    lastTotalsAt: { type: Date, default: null },
  },
  { timestamps: true }
);
companySchema.index({ createdBy: 1, name: 1 }, { unique: true });

const Company = mongoose.model("Company", companySchema);
export default Company;
