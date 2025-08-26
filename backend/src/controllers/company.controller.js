import Company from "../models/company.model.js";

export const getCompanies = async (req, res) => {
    try {
        const companies = await Company.find();
        res.json({success:true,count:companies.length,data:companies});
    } catch (error) {
        console.error('Error fetching companies:', error);
        res.status(500).json({ success:false, error: error.message });
    }
};