import Policy from '../models/policy.model.js';
import csvParser from 'csv-parser';
import { Readable } from 'stream';

// Create a new policy
export const createPolicy = async (req, res) => {
  try {
    const policy = new Policy(req.body);
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

    const policies = await Policy.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Policy.countDocuments();
    
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
  }
};

// Get a single policy by ID
export const getPolicyById = async (req, res) => {
  try {
    const policy = await Policy.findById(req.params.id);
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
    const policy = await Policy.findByIdAndUpdate(
      req.params.id,
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
    const policy = await Policy.findByIdAndDelete(req.params.id);
    if (!policy) {
      return res.status(404).json({ message: 'Policy not found' });
    }
    res.json({ message: 'Policy deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Upload policies from CSV
export const uploadPolicies = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const results = [];
    const errors = [];
    let processedCount = 0;
    const batchSize = 100; // Process in batches of 100
    
    // Create a readable stream from the buffer
    const readableStream = new Readable();
    readableStream.push(req.file.buffer);
    readableStream.push(null);

    // Process the CSV file
    const processCSV = () => new Promise((resolve, reject) => {
      readableStream
        .pipe(csvParser())
        .on('data', (data) => {
          // Convert string numbers to actual numbers
          const processedData = {
            ...data,
            FIN_YR: data.FIN_YR ? Number(data.FIN_YR) : 0,
            FIN_MONTH: data.FIN_MONTH ? Number(data.FIN_MONTH) : 0,
            premiumPayingTerm: data.premiumPayingTerm ? Number(data.premiumPayingTerm) : 0,
            policyTerm: data.policyTerm ? Number(data.policyTerm) : 0,
            PREMIUM: data.PREMIUM ? Number(data.PREMIUM) : 0,
            netPremium: data.netPremium ? Number(data.netPremium) : 0,
            sumAssured: data.sumAssured ? Number(data.sumAssured) : 0,
            FYWRP: data.FYWRP ? Number(data.FYWRP) : 0
          };
          results.push(processedData);
        })
        .on('end', () => resolve())
        .on('error', (error) => reject(error));
    });

    await processCSV();

    // Process policies in batches
    for (let i = 0; i < results.length; i += batchSize) {
      const batch = results.slice(i, i + batchSize);
      const bulkOps = batch.map(policy => ({
        updateOne: {
          filter: { policyNo: policy.policyNo },
          update: { $set: policy },
          upsert: true
        }
      }));

      try {
        await Policy.bulkWrite(bulkOps);
        processedCount += batch.length;
        
        // Log progress
        const progress = Math.round((processedCount / results.length) * 100);
        console.log(`Processed ${processedCount} of ${results.length} policies (${progress}%)`);
      } catch (batchError) {
        errors.push({
          batch: i / batchSize + 1,
          error: batchError.message
        });
      }
    }

    res.json({
      message: 'Policies uploaded successfully',
      totalProcessed: processedCount,
      totalErrors: errors.length,
      errors
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      message: 'Error processing file',
      error: error.message 
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
