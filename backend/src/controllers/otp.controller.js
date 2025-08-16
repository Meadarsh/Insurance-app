import httpStatus from 'http-status';
import otpService from '../services/otp.service.js';
import User from '../models/user.model.js';


const sendOtp = async (req, res, next) => {
  try {
    const { email, type = 'verification' } = req.body;

    // Check if user exists for signup OTP
    if (type === 'signup') {
      const userExists = await User.isEmailTaken(email);
      if (userExists) {
        res.status(httpStatus.BAD_REQUEST).json({
          success: false,
          message: 'User already exists',
        });
      }
    } else {
      // For other OTP types, check if user exists
      const user = await User.findOne({ email });
      if (!user) {
        res.status(httpStatus.BAD_REQUEST).json({
          success: false,
          message: 'User not found',
        });
      }
    }

    await otpService.sendOTP(email, type);
    
    res.status(httpStatus.OK).json({
      success: true,
      message: 'OTP sent successfully',
    });
  } catch (error) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to send OTP',
    });
  }
};

const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp, type = 'verification' } = req.body;

    const isValid = await otpService.verifyOTP(email, otp, type);
    
    if (!isValid) {
      res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Invalid or expired OTP',
      });
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
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to verify OTP',
    });
  }
};

export default {
  sendOtp,
  verifyOtp,
};
