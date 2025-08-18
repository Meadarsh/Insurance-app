import Master from '../models/master.model.js';
import csv from 'csv-parser';
import fs from 'fs';

// Create a new master record
export const createMaster = async (req, res) => {
  try {
    const master = await Master.create(req.body);
    res.status(201).json({ success: true, data: master });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Get all master records
export const getMasters = async (req, res) => {
  try {
    const masters = await Master.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: masters.length, data: masters });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Get single master record
export const getMaster = async (req, res) => {
  try {
    const master = await Master.findById(req.params.id);
    if (!master) {
      return res.status(404).json({ success: false, error: 'Master record not found' });
    }
    res.status(200).json({ success: true, data: master });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Update master record
export const updateMaster = async (req, res) => {
  try {
    const master = await Master.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!master) {
      return res.status(404).json({ success: false, error: 'Master record not found' });
    }
    res.status(200).json({ success: true, data: master });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Delete master record
export const deleteMaster = async (req, res) => {
  try {
    const master = await Master.findByIdAndDelete(req.params.id);
    if (!master) {
      return res.status(404).json({ success: false, error: 'Master record not found' });
    }
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Upload CSV
export const uploadCSV = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'Please upload a CSV file' });
  }

  const results = [];
  
  try {
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => {
        // Transform CSV data to match Master schema
        const masterData = {
          productName: data['Product Name'],
          premiumPayingTerm: (() => {
            const term = data['Premium Paying Term'] || '0';
            if (term.includes('+')) {
              const minValue = parseInt(term);
              return { min: isNaN(minValue) ? 0 : minValue, max: null };
            }
            const numValue = parseInt(term);
            return { min: isNaN(numValue) ? 0 : numValue, max: isNaN(numValue) ? 0 : numValue };
          })(),
          policyTerm: Number(data['Policy Term'] || 0),
          policyNumber: data['Policy Number'],
          policyPrices: [
            {
              price: Number(data['Policy Prices'] || 0),
              date: new Date()
            }
          ],
          productVariant: data['Product Variant'],
          totalRate: Number(String(data['Total Rate'] || 0).replace('%', '')),
          commission: Number(String(data['Commission'] || 0).replace('%', '')),
          reward: Number(String(data['Reward'] || 0).replace('%', ''))
        };
        results.push(masterData);
      })
      .on('end', async () => {
        try {
          // Remove existing records if needed
          // await Master.deleteMany({});
          
          // Insert new records
          const createdMasters = await Master.insertMany(results);
          
          // Delete the file after processing
          fs.unlinkSync(req.file.path);
          
          res.status(201).json({
            success: true,
            count: createdMasters.length,
            data: createdMasters
          });
        } catch (error) {
          res.status(400).json({ success: false, error: error.message });
        }
      });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
