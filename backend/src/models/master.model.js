// models/master.model.js
import mongoose from "mongoose";

const masterSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    productName: String,
    productVariant: String,

    // ⬇️ CHANGED (range instead of single number)
    premiumPayingTermMin: { type: Number, required: true },
    premiumPayingTermMax: { type: Number, default: null }, // null => open-ended (e.g., 11+)

    policyTerm: Number,
    policyNumber: String,

    totalRate: Number,
    commission: Number,
    reward: Number,
    vli: Number,
  },
  { timestamps: true }
);

// helpful indexes
masterSchema.index({
  company: 1,
  productName: 1,
  productVariant: 1,
  policyTerm: 1,
  premiumPayingTermMin: 1,
  premiumPayingTermMax: 1,
});

export default mongoose.model("Master", masterSchema);
