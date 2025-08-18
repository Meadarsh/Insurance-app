import httpStatus from 'http-status';
import otpService from '../services/otp.service.js';
import User from '../models/user.model.js';

const sendOtp = async (req, res, next) => {
  try {
    console.log('OTP Send Request received:', req.body);
    const { email, type = 'verification' } = req.body;

    console.log('Checking user existence...');
    // Check if user exists for signup OTP
    if (type === 'signup') {
      const userExists = await User.isEmailTaken(email);
      console.log('User exists check completed:', userExists);
      if (userExists) {
        return res.status(httpStatus.BAD_REQUEST).json({
          success: false,
          message: 'User already exists',
        });
      }
    } else {
      // For other OTP types, check if user exists
      const user = await User.findOne({ email });
      console.log('User lookup completed:', !!user);
      if (!user) {
        return res.status(httpStatus.BAD_REQUEST).json({
          success: false,
          message: 'User not found',
        });
      }
    }

    console.log('Sending OTP...');
    await otpService.sendOTP(email, type);
    console.log('OTP sent successfully');
    
    res.status(httpStatus.OK).json({
      success: true,
      message: 'OTP sent successfully',
    });
  } catch (error) {
    console.error('OTP Send Error:', error);
    next(error);
  }
};

const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp, type = 'verification' } = req.body;

    const isValid = await otpService.verifyOTP(email, otp, type);
    
    if (!isValid) {
      return res.status(httpStatus.BAD_REQUEST).json({
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
    next(error);
  }
};

export default {
  sendOtp,
  verifyOtp,
};
