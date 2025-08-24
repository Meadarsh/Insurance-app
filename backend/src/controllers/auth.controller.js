import User from '../models/user.model.js';
import httpStatus from 'http-status';
import { generateAuthTokens, verifyToken } from '../utils/token.js';

const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    
    if (await User.isEmailTaken(email)) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Email already taken',
      });
    }
    
    const user = await User.create({ name, email, password, role });
    const tokens = await generateAuthTokens(user);
    
    res.status(httpStatus.CREATED).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
      tokens,
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    
    if (!user || !(await user.isPasswordMatch(password))) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        success: false,
        message: 'Incorrect email or password',
      });
    }
    
    if (!user.isActive) {
      return res.status(httpStatus.FORBIDDEN).json({
        success: false,
        message: 'Account is deactivated',
      });
    }
    
    const tokens = await generateAuthTokens(user);
    
    res.status(httpStatus.OK).json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
      tokens,
    });
  } catch (error) {
    next(error);
  }
};

const refreshAuth = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Refresh token is required',
      });
    }
    
    try {
      // Verify the refresh token
      const decoded = await verifyToken(refreshToken, 'refresh');
      
      // Find the user
      const user = await User.findById(decoded.sub);
      if (!user || !user.isActive) {
        return res.status(httpStatus.UNAUTHORIZED).json({
          success: false,
          message: 'Invalid refresh token or user not found',
        });
      }
      
      // Generate new tokens
      const tokens = await generateAuthTokens(user);
      
      res.status(httpStatus.OK).json({
        success: true,
        message: 'Token refreshed successfully',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
        },
        tokens,
      });
    } catch (tokenError) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        success: false,
        message: 'Invalid or expired refresh token',
      });
    }
  } catch (error) {
    next(error);
  }
};

export default {
  register,
  login,
  refreshAuth,
};
