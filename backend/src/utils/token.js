import jwt from 'jsonwebtoken';
import moment from 'moment';
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

const generateAuthTokens = async (user) => {
  const accessTokenExpires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
  const accessToken = generateToken(user._id, accessTokenExpires, 'access');

  const refreshTokenExpires = moment().add(config.jwt.refreshExpirationDays, 'days');
  const refreshToken = generateToken(user._id, refreshTokenExpires, 'refresh');

  return {
    accessToken,
    refreshToken,
    accessTokenExpires: accessTokenExpires.toDate(),
    refreshTokenExpires: refreshTokenExpires.toDate(),
  };
};

export { generateAuthTokens };

export default {
  generateAuthTokens,
};
