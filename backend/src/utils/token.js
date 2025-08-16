import jwt from 'jsonwebtoken';
import moment from 'moment';
import { tokenTypes } from '../config/tokens.js';
import OTP from '../models/otp.model.js';
import config from '../config/config.js';

const generateToken = (userId, expires, type, secret = config.jwt.secret) => {
  const payload = {
    sub: userId,
    iat: Math.floor(Date.now() / 1000),
    exp: expires.unix(),
    type,
  };
  return jwt.sign(payload, secret);
};

const verifyToken = async (token, type) => {
  const payload = jwt.verify(token, config.jwt.secret);
  const tokenDoc = await OTP.findOne({ token, type, user: payload.sub, blacklisted: false });
  if (!tokenDoc) {
    throw new Error('Token not found');
  }
  return tokenDoc;
};


const generateAuthTokens = async (user) => {
  const accessTokenExpires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
  const accessToken = generateToken(user.id, accessTokenExpires, tokenTypes.ACCESS);

  const refreshTokenExpires = moment().add(config.jwt.refreshExpirationDays, 'days');
  const refreshToken = generateToken(user.id, refreshTokenExpires, tokenTypes.REFRESH);
  
  await OTP.create({
    token: refreshToken,
    user: user.id,
    expiresAt: refreshTokenExpires.toDate(),
    type: tokenTypes.REFRESH,
    blacklisted: false,
  });

  return {
    access: {
      token: accessToken,
      expires: accessTokenExpires.toDate(),
    },
    refresh: {
      token: refreshToken,
      expires: refreshTokenExpires.toDate(),
    },
  };
};

export { generateAuthTokens, verifyToken };

export default {
  verifyToken,
  generateAuthTokens,
};
