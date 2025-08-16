const httpStatus = require('http-status');
const { User } = require('../models');
const ApiError = require('../utils/ApiError');
const { generateToken, verifyToken } = require('../utils/token');

/**
 * Register a new user
 * @param {Object} userBody
 * @returns {Promise<User>}
 */
const register = async (userBody) => {
  if (await User.isEmailTaken(userBody.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  
  const user = await User.create(userBody);
  const tokens = await generateToken(user);
  
  return { user, tokens };
};

/**
 * Login with email and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{user: User, tokens: Object}>}
 */
const login = async (email, password) => {
  const user = await User.findOne({ email });
  
  if (!user || !(await user.isPasswordMatch(password))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
  }
  
  if (!user.isActive) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Account is deactivated');
  }
  
  const tokens = await generateToken(user);
  return { user, tokens };
};

/**
 * Refresh auth tokens
 * @param {string} refreshToken
 * @returns {Promise<Object>}
 */
const refreshAuth = async (refreshToken) => {
  try {
    const user = await verifyToken(refreshToken, 'refresh');
    const tokens = await generateToken(user);
    return { user, tokens };
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid refresh token');
  }
};

module.exports = {
  register,
  login,
  refreshAuth,
}
