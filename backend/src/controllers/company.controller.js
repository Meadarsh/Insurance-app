import Company from "../models/company.model.js";
import Master from "../models/master.model.js";
import Policy from "../models/policy.model.js";

export const getCompanies = async (req, res) => {
  try {
    const companies = await Company.find();
    res.json({ success: true, count: companies.length, data: companies });
  } catch (error) {
    console.error("Error fetching companies:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
export const deleteCompany = async (req, res) => {
  try {
    const { companyId } = req.params;

    if (!mongoose.isValidObjectId(companyId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid company id" });
    }

    const company = await Company.findOne({
      _id: companyId,
      createdBy: req.user._id,
    });
    if (!company) {
      return res
        .status(404)
        .json({ success: false, message: "Company not found" });
    }

    const USE_TX = process.env.USE_TRANSACTIONS === "true";

    if (USE_TX) {
      const session = await mongoose.startSession();
      try {
        await session.withTransaction(async () => {
          await Master.deleteMany({ company: company._id }, { session });
          await Policy.deleteMany({ company: company._id }, { session });
          await Company.deleteOne({ _id: company._id }, { session });
        });
      } finally {
        await session.endSession();
      }
    } else {
      await Master.deleteMany({ company: company._id });
      await Policy.deleteMany({ company: company._id });
      await Company.deleteOne({ _id: company._id });
    }

    return res.json({
      success: true,
      message: "Company and related data deleted",
    });
  } catch (err) {
    console.error("deleteCompany error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
