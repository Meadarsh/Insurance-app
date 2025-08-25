// Leader get access so (Admin) and can also ad vendors  

import Vendor from '../models/vendor.model.js';
import csvParser from 'csv-parser';
import { Readable } from 'stream';

// Create a new vendor
export const createVendor = async (req, res) => {
  try {
    const vendor = new Vendor({ ...req.body, userId: req.user._id });
    await vendor.save();
    res.status(201).json(vendor);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all vendors with pagination
export const getVendors = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const vendors = await Vendor.find({ userId: req.user._id })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Vendor.countDocuments({ userId: req.user._id });
    
    res.json({
      data: vendors,
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

// Get a single vendor by ID
export const getVendorById = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ _id: req.params.id, userId: req.user._id });
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    res.json(vendor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a vendor
export const updateVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    res.json(vendor);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a vendor
export const deleteVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    res.json({ message: 'Vendor deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Upload vendors from CSV
export const uploadVendors = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const results = [];
  const errors = [];
  let processedCount = 0;
  const batchSize = 100;
  
  try {
    // Create a readable stream from the buffer
    const readableStream = new Readable();
    readableStream.push(req.file.buffer);
    readableStream.push(null);

    // Process the CSV file
    const processCSV = () => new Promise((resolve, reject) => {
      const vendors = [];
      
      readableStream
        .pipe(csvParser())
        .on('data', (row) => {
          try {
            // Convert row data to vendor object
            const vendorData = {};
            
            // Map all fields that exist in the row
            Object.entries(row).forEach(([key, value]) => {
              if (value !== undefined && value !== null && value !== '') {
                // Convert field names to match model (e.g., 'Payee Code' -> 'payeeCode')
                // Only convert spaces to camelCase, preserve original case for other characters
                const fieldName = key
                  .replace(/\s+(\w)/g, (_, letter) => letter.toUpperCase())
                  .replace(/\s+/g, ''); // Remove spaces only
                
                // Convert string numbers to actual numbers
                if (!isNaN(value) && value !== '') {
                  vendorData[fieldName] = parseFloat(value);
                } 
                // Convert date strings to Date objects
                else if (key.toLowerCase().includes('date') || key.toLowerCase().includes('dt')) {
                  const date = new Date(value);
                  if (!isNaN(date.getTime())) {
                    vendorData[fieldName] = date;
                  } else {
                    vendorData[fieldName] = value;
                  }
                } 
                // Keep other values as is
                else {
                  vendorData[fieldName] = value;
                }
              }
            });
            
            // Add backward compatible fields
            if (vendorData.payeeCode) vendorData.PAYCLT = vendorData.payeeCode;
            if (vendorData.TRANSACTIONNO) vendorData.BATCTRCD = vendorData.TRANSACTIONNO;
            if (vendorData.PREMIUM) vendorData.ORIGAMT = vendorData.PREMIUM;
            if (vendorData.EFFECT) vendorData.txnDesc = vendorData.EFFECT;
            if (vendorData.branchName) vendorData.branchLocation = vendorData.branchName;
            if (vendorData.sumAssured) vendorData.totalSumAssured = vendorData.sumAssured;
            if (vendorData.agentType) vendorData.vendorType = vendorData.agentType;
            if (vendorData.branchCode) vendorData.agentBranchCode = vendorData.branchCode;
            
            vendors.push(vendorData);
          } catch (error) {
            console.error('Error processing row:', row, error);
            errors.push({
              row,
              error: error.message
            });
          }
        })
        .on('end', () => {
          resolve(vendors);
        })
        .on('error', (error) => {
          reject(error);
        });
    });

    // Process the CSV and get all vendors
    const vendors = await processCSV();
    
    // Process vendors in batches
    for (let i = 0; i < vendors.length; i += batchSize) {
      const batch = vendors.slice(i, i + batchSize);
      
      // Prepare bulk write operations
      const bulkOps = batch.map(vendor => {
        const filter = { policyNo: vendor.policyNo };
        return {
          updateOne: {
            filter,
            update: { $set: { ...vendor, userId: req.user._id } }, // Add userId to the bulk operation
            upsert: true
          }
        };
      });
      
      // Execute bulk write
      if (bulkOps.length > 0) {
        try {
          const result = await Vendor.bulkWrite(bulkOps, { ordered: false });
          processedCount += result.upsertedCount + result.modifiedCount;
        } catch (error) {
          console.error('Error in bulk write:', error);
          errors.push({
            error: 'Bulk write error',
            details: error.message
          });
        }
      }
    }
    
    return res.status(200).json({
      message: 'Vendors processed successfully',
      processed: processedCount,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error processing CSV:', error);
    return res.status(500).json({
      message: 'Error processing CSV',
      error: error.message
    });
  }
};

// Search vendors
export const searchVendors = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const vendors = await Vendor.find({
      userId: req.user._id,
      $or: [
        { payeeName: { $regex: query, $options: 'i' } },
        { agentName: { $regex: query, $options: 'i' } },
        { policyNo: { $regex: query, $options: 'i' } },
        { PAYCLT: { $regex: query, $options: 'i' } }
      ]
    }).limit(50);

    res.json(vendors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};