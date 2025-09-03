import FileUpload from '../models/fileUpload.model.js';
import fs from 'fs';

export const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new Error('No file uploaded', 400);
    }

    const { sourceMonth, description } = req.body;
    
    if (!sourceMonth) {
      // Delete the uploaded file if validation fails
      fs.unlinkSync(req.file.path);
      throw new  Error('Source month is required', 400);
    }

    const fileUpload = new FileUpload({
      sourceMonth,
      fileName: req.file.originalname,
      filePath: req.file.path,
      uploadedBy: req.user._id,
      status: 'PENDING',
      description
    });

    await fileUpload.save();

    res.status(201).json({
      success: true,
      data: fileUpload
    });
  } catch (error) {
    next(error);
  }
};

export const getFileUploads = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = {};
    
    if (status) {
      query.status = status;
    }

    const fileUploads = await FileUpload.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('uploadedBy', 'name email');

    const count = await FileUpload.countDocuments(query);

    res.status(200).json({
      success: true,
      data: fileUploads,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get file upload by ID
// @route   GET /api/file-upload/:id
// @access  Private
export const getFileUploadById = async (req, res, next) => {
  try {
    const fileUpload = await FileUpload.findById(req.params.id)
      .populate('uploadedBy', 'name email');

    if (!fileUpload) {
      throw new ErrorHandler('File upload not found', 404);
    }

    res.status(200).json({
      success: true,
      data: fileUpload
    });
  } catch (error) {
    next(error);
  }
};

export const updateFileUploadStatus = async (req, res, next) => {
  try {
    const { status, totalProcessedRecords, totalReconValue, outputReconValue, error } = req.body;
    
    const updates = {};
    if (status) updates.status = status;
    if (totalProcessedRecords !== undefined) updates.totalProcessedRecords = totalProcessedRecords;
    if (totalReconValue !== undefined) updates.totalReconValue = totalReconValue;
    if (outputReconValue !== undefined) updates.outputReconValue = outputReconValue;
    if (error !== undefined) updates.error = error;

    const fileUpload = await FileUpload.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!fileUpload) {
      throw new ErrorHandler('File upload not found', 404);
    }

    res.status(200).json({
      success: true,
      data: fileUpload
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Download file
// @route   GET /api/file-upload/:id/download
// @access  Private
export const downloadFile = async (req, res, next) => {
  try {
    const fileUpload = await FileUpload.findById(req.params.id);

    if (!fileUpload) {
      throw new ErrorHandler('File not found', 404);
    }

    if (!fs.existsSync(fileUpload.filePath)) {
      throw new ErrorHandler('File no longer exists on server', 404);
    }

    res.download(fileUpload.filePath, fileUpload.fileName);
  } catch (error) {
    next(error);
  }
};
