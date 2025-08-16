import mongoose from 'mongoose';
import { toJSON, paginate } from './plugins';

const otpSchema = mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    otp: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    type: {
      type: String,
      enum: ['signup', 'login', 'reset', 'verification'],
      required: true,
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Add plugin that converts mongoose to JSON
otpSchema.plugin(toJSON);
otpSchema.plugin(paginate);

// Index for faster queries
otpSchema.index({ email: 1, type: 1 });

// Static method to find valid OTP
otpSchema.statics.findValidOtp = async function (email, otp, type) {
  const currentDate = new Date();
  return this.findOne({
    email,
    otp,
    type,
    isUsed: false,
    expiresAt: { $gt: currentDate },
  });
};

const OTP = mongoose.model('OTP', otpSchema);

export default OTP;
