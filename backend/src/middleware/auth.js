const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const { verifyToken } = require('../utils/token');

const auth = (requiredRoles = []) => {
  return async (req, res, next) => {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      
      if (!token) {
        throw new Error('Authentication required');
      }

      const decoded = await verifyToken(token, 'access');
      const user = await User.findById(decoded.sub);

      if (!user || !user.isActive) {
        throw new Error('User not found or inactive');
      }

      if (requiredRoles.length && !requiredRoles.includes(user.role)) {
        throw new Error('Insufficient permissions');
      }

      req.user = user;
      next();
    } catch (error) {
      next(new ApiError(httpStatus.UNAUTHORIZED, error.message));
    }
  };
};

module.exports = auth;
