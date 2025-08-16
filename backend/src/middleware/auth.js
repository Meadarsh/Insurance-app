import User from "../models/user.model.js";
import { verifyToken } from "../utils/token.js";


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
      next(error);
    }
  };
};

module.exports = auth;
