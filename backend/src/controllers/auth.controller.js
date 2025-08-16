import httpStatus from 'http-status';
import User from '../models/user.model.js';
import { generateAuthTokens } from '../utils/token.js';

const register = async (userBody) => {
  if (await User.isEmailTaken(userBody.email)) {
    throw new Error(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  
  const user = await User.create(userBody);
  const tokens = await generateAuthTokens(user);
  
  return { user, tokens };
};


const login = async (email, password) => {
  const user = await User.findOne({ email });
  
  if (!user || !(await user.isPasswordMatch(password))) {
    throw new Error(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
  }
  
  if (!user.isActive) {
    throw new Error(httpStatus.FORBIDDEN, 'Account is deactivated');
  }
  
  const tokens = await generateAuthTokens(user);
  return { user, tokens };
};


const refreshAuth = async (refreshToken) => {
  try {
    const user = await verifyToken(refreshToken, 'refresh');
    const tokens = await generateToken(user);
    return { user, tokens };
  } catch (error) {
    throw new Error(httpStatus.UNAUTHORIZED, 'Invalid refresh token');
  }
};

export default {
  register,
  login,
  refreshAuth,
}
