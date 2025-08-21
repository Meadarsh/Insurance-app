import Policy from '../models/policy.model.js';
import csvParser from 'csv-parser';
import { Readable } from 'stream';
import masterModel from '../models/master.model.js';

// Create a new policy
export const createPolicy = async (req, res) => {
  try {
    const policy = new Policy({ ...req.body, userId: req.user._id });
    await policy.save();
    res.status(201).json(policy);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all policies with pagination
export const getPolicies = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const policies = await Policy.find({ userId: req.user._id })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Policy.countDocuments({ userId: req.user._id });
    
    res.json({
      data: policies,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
    console.log(error);
  }
};

// Get a single policy by ID
export const getPolicyById = async (req, res) => {
  try {
    const policy = await Policy.findOne({ _id: req.params.id, userId: req.user._id });
    if (!policy) {
      return res.status(404).json({ message: 'Policy not found' });
    }
    res.json(policy);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a policy
export const updatePolicy = async (req, res) => {
  try {
    const policy = await Policy.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!policy) {
      return res.status(404).json({ message: 'Policy not found' });
    }
    res.json(policy);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a policy
export const deletePolicy = async (req, res) => {
  try {
    const policy = await Policy.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!policy) {
      return res.status(404).json({ message: 'Policy not found' });
    }
    res.json({ message: 'Policy deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


// Helper function to parse dates in various formats
const parseDate = (dateString) => {
  if (!dateString) return null;
  
  // Try MM/DD/YYYY format first
  if (dateString.includes('/')) {
    const [month, day, year] = dateString.split('/').map(Number);
    const date = new Date(year, month - 1, day);
    if (!isNaN(date.getTime())) return date;
  }
  
  // Try YYYY-MM-DD format (ISO)
  if (dateString.includes('-')) {
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) return date;
  }
  
  // If we get here, log the problematic date for debugging
  console.warn('Could not parse date:', dateString);
  return null; // Return null for invalid dates instead of Invalid Date
};

export const uploadPolicies = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const masterData = await masterModel.find({ userId: req.user?._id});
    console.log(masterData);
    
    if (!masterData || masterData.length === 0) {
      return res.status(404).json({ message: "Master records not found" });
    }

    const results = [];
    const errors = [];
    let processedCount = 0;
    const batchSize = 100;

    const readableStream = new Readable();
    readableStream.push(req.file.buffer);
    readableStream.push(null);

    const processCSV = () =>
      new Promise((resolve, reject) => {
        readableStream
          .pipe(csvParser())
          .on("data", (data) => {
            const processedData = {
              SRC: data.SRC,
              FIN_YR: data.FIN_YR ? Number(data.FIN_YR) : 0,
              FIN_MONTH: data.FIN_MONTH ? Number(data.FIN_MONTH) : 0,
              applicationNo: data["Application No"],
              policyNo: data["Policy No"],
              CHDRSTCDB: data.CHDRSTCDB,
              proposalDate: data["Proposal Date"] ? parseDate(data["Proposal Date"]) : null,
              originalIssueDate: data["Original Issue Date"] ? parseDate(data["Original Issue Date"]) : null,
              contractCommencementDate: data["Contract Commencement Date"] ? parseDate(data["Contract Commencement Date"]) : null,
              premiumPayingTerm: data["Premium Paying Term"] ? Number(data["Premium Paying Term"]) : 0,
              policyTerm: data["Policy Term"] ? Number(data["Policy Term"]) : 0,
              branchCode: data["Branch Code"],
              branchName: data["Branch Name"],
              productCode: data["Product Code"],
              productName: data["Product Name"],
              productVariant: data["Product Variant"],
              PREMIUM: data.PREMIUM ? Number(data.PREMIUM) : 0,
              netPremium: data["Net Premium"] ? Number(data["Net Premium"]) : 0,
              sumAssured: data["Sum Assured"] ? Number(data["Sum Assured"]) : 0,
              FYWRP: data.FYWRP ? Number(data.FYWRP) : 0,
              transactionDateFinal: data["Transaction Date Final"] ? parseDate(data["Transaction Date Final"]) : null,
              transactionDate: data["Transaction Date"] ? parseDate(data["Transaction Date"]) : (data.transactionDate ? parseDate(data.transactionDate) : null),
              cancellationDate: data["Cancellation Date"] ? parseDate(data["Cancellation Date"]) : null,
              userId: req.user?._id,
            };
            results.push(processedData);
          })
          .on("end", () => resolve())
          .on("error", (error) => reject(error));
      });

    await processCSV();

    for (let i = 0; i < results.length; i += batchSize) {
      const batch = results.slice(i, i + batchSize);

      const bulkOps = await Promise.all(
        batch.map(async (policy) => {
          try {
            // find matching master record
            const master = masterData.find((m) => {
              const nameMatch =
                m.productName.trim().toLowerCase() ===
                (policy.productName || "").trim().toLowerCase();

              if (!nameMatch) return false;

              const term = policy.premiumPayingTerm || 0;
              const min = m.premiumPayingTerm?.min || 0;
              const max = m.premiumPayingTerm?.max;

              if (max === null) {
                return term >= min;
              }
              return term >= min && term <= max;
            });

            if (!master) {
              errors.push({ policyNo: policy.policyNo, error: "No matching master found" });
              return null;
            }

            const totalRateValue = (policy.PREMIUM * (master.totalRate || 0)) / 100;
            const commissionValue = (policy.PREMIUM * (master.commission || 0)) / 100;
            const rewardValue = (policy.PREMIUM * (master.reward || 0)) / 100;

            return {
              updateOne: {
                filter: { policyNo: policy.policyNo },
                update: {
                  $set: {
                    ...policy,
                    totalRate: totalRateValue,
                    commission: commissionValue,
                    reward: rewardValue,
                    masterRef: master._id,
                  },
                },
                upsert: true,
              },
            };
          } catch (err) {
            errors.push({ policyNo: policy.policyNo, error: err.message });
            return null;
          }
        })
      );

      const validOps = bulkOps.filter(Boolean);

      if (validOps.length > 0) {
        await Policy.bulkWrite(validOps);
        processedCount += validOps.length;
        console.log(`Processed ${processedCount}/${results.length}`);
      }
    }

    res.json({
      message: "Policies uploaded successfully",
      totalProcessed: processedCount,
      totalErrors: errors.length,
      errors,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      message: "Error processing file",
      error: error.message,
    });
  }
};


// Search policies
export const searchPolicies = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const policies = await Policy.find({
      userId: req.user._id,
      $or: [
        { policyNo: { $regex: query, $options: 'i' } },
        { applicationNo: { $regex: query, $options: 'i' } },
        { customerName: { $regex: query, $options: 'i' } },
        { agentName: { $regex: query, $options: 'i' } },
        { productName: { $regex: query, $options: 'i' } }
      ]
    }).limit(50);

    res.json(policies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get policy statistics
export const getPolicyStats = async (req, res) => {
  try {
    const stats = await Policy.aggregate([
      {
        $match: { userId: req.user._id }
      },
      {
        $group: {
          _id: null,
          totalPolicies: { $sum: 1 },
          totalSumAssured: { $sum: '$sumAssured' },
          totalPremium: { $sum: '$PREMIUM' },
          byProduct: { 
            $push: {
              product: '$productName',
              count: 1,
              sumAssured: '$sumAssured',
              premium: '$PREMIUM'
            } 
          }
        }
      },
      {
        $unwind: '$byProduct'
      },
      {
        $group: {
          _id: '$byProduct.product',
          count: { $sum: 1 },
          totalSumAssured: { $sum: '$byProduct.sumAssured' },
          totalPremium: { $sum: '$byProduct.premium' }
        }
      },
      {
        $project: {
          _id: 0,
          product: '$_id',
          count: 1,
          totalSumAssured: 1,
          totalPremium: 1,
          averagePremium: { $divide: ['$totalPremium', '$count'] }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
