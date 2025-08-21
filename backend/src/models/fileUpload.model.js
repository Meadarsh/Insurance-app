import mongoose from 'mongoose';

const fileUploadSchema = new mongoose.Schema({
    type:{
        type: String,
        enum: ['Master', 'Policy', 'Vendor'],
        required: true
    },
    sourceMonth: {
    type: String,
    required: true,
    trim: true
  },
  fileName: {
    type: String,
    required: true,
    trim: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  totalProcessedRecords: {
    type: Number,
    default: 0
  },
  totalReconValue: {
    type: Number,
    default: null
  },
  outputReconValue: {
    type: Number,
    default: null
  },
  status: {
    type: String,
    enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
    default: 'PENDING'
  },
  filePath: {
    type: String,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  error: {
    type: String,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

const FileUpload = mongoose.model('FileUpload', fileUploadSchema);

export default FileUpload;
