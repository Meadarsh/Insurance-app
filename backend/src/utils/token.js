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

const verifyToken = async (token, type) => {
  console.log('Verifying token type:',token);
  
  const payload = jwt.verify(token, config.jwt.secret);
  if(payload.type !== type){
    throw new Error('Invalid token type');
  }
  return payload;
};

export { generateAuthTokens, verifyToken };

export default {
  generateAuthTokens,
  verifyToken,
};
