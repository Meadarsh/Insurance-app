import Master from '../models/master.model.js';
import csv from 'csv-parser';
import fs from 'fs';

// Create a new master record
export const createMaster = async (req, res) => {
  try {
    // Use a default user ID or make userId optional
    const userId = req.user?._id || '000000000000000000000000'; // Default ObjectId
    const master = await Master.create({ ...req.body, userId });
    res.status(201).json({ success: true, data: master });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
 };

// Get all master records
export const getMasters = async (req, res) => {
  try {
    // Get all masters without user filtering for now
    const masters = await Master.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: masters.length, data: masters });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Get single master record
export const getMaster = async (req, res) => {
  try {
    const master = await Master.findById(req.params.id).populate('userId');
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

  console.log('File received:', req.file);
  console.log('File path:', req.file.path);
  console.log('File size:', req.file.size);

  const results = [];
  
  try {
    // Check if file exists and is readable
    if (!fs.existsSync(req.file.path)) {
      return res.status(500).json({ success: false, error: 'Uploaded file not found' });
    }

    // Create a promise-based CSV processing
    const processCSV = () => {
      return new Promise((resolve, reject) => {
        const stream = fs.createReadStream(req.file.path);
        
        stream.on('error', (error) => {
          console.error('Stream error:', error);
          reject(error);
        });

        stream
          .pipe(csv())
          .on('data', (data) => {
            try {
              console.log('Processing CSV row:', data);
              // Transform CSV data to match Master schema
              const masterData = {
                productName: data['Product Name'] || 'Unknown Product',
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
                policyNumber: data['Policy Number'] || `POL${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                policyPrices: [
                  {
                    price: Number(data['Policy Prices'] || 0),
                    date: new Date()
                  }
                ],
                productVariant: data['Product Variant'] || 'Standard',
                totalRate: Number(String(data['Total Rate'] || 0).replace('%', '')) || 0,
                commission: Number(String(data['Commission'] || 0).replace('%', '')) || 0,
                reward: Number(String(data['Reward'] || 0).replace('%', '')) || 0,
                userId: req.user?._id || '000000000000000000000000' // Default ObjectId
              };
              results.push(masterData);
            } catch (rowError) {
              console.error('Error processing row:', rowError, data);
              // Continue processing other rows
            }
          })
          .on('end', () => {
            console.log('CSV processing completed. Rows processed:', results.length);
            resolve(results);
          })
          .on('error', (error) => {
            console.error('CSV parsing error:', error);
            reject(error);
          });
      });
    };

    // Process the CSV
    await processCSV();
    
    if (results.length === 0) {
      // Clean up the file
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ success: false, error: 'No valid data found in CSV file' });
    }

    console.log('Attempting to insert', results.length, 'records into database');
    
    // Insert new records
    const createdMasters = await Master.insertMany(results);
    console.log('Successfully inserted', createdMasters.length, 'records');
    
    // Clean up the file after processing
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(201).json({
      success: true,
      count: createdMasters.length,
      data: createdMasters
    });
    
  } catch (error) {
    console.error('Upload CSV error:', error);
    
    // Clean up the file on error
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError);
      }
    }
    
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error during CSV processing' 
    });
  }
};
