import httpStatus from 'http-status';
import ApiError from '../utils/ApiError';
import { User } from '../models';
import otpService from '../services/otp.service';

/**
 * Send OTP to user's email
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
const sendOtp = async (req, res, next) => {
  try {
    const { email, type = 'verification' } = req.body;

    // Check if user exists for signup OTP
    if (type === 'signup') {
      const userExists = await User.isEmailTaken(email);
      if (userExists) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Email already registered');
      }
    } else {
      // For other OTP types, check if user exists
      const user = await User.findOne({ email });
      if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
      }
    }

    await otpService.sendOTP(email, type);
    
    res.status(httpStatus.OK).json({
      success: true,
      message: 'OTP sent successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify OTP
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp, type = 'verification' } = req.body;

    const isValid = await otpService.verifyOTP(email, otp, type);
    
    if (!isValid) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid or expired OTP');
    }

    // If this is a verification OTP, update user's verification status
    if (type === 'verification') {
      await User.findOneAndUpdate(
        { email },
        { isVerified: true },
        { new: true }
      );
    }

    res.status(httpStatus.OK).json({
      success: true,
      message: 'OTP verified successfully',
    });
  } catch (error) {
    next(error);
  }
};

export default {
  sendOtp,
  verifyOtp,
};
