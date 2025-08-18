import User from "../models/user.model.js";
import { verifyToken } from "../utils/token.js";

console.log('Auth middleware module loaded');

const protect = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');

    if (!authHeader) {
      console.error('No Authorization header found');
      return res.status(401).json({ success: false, error: 'No token provided' });
    }
    
    // More flexible token extraction
    let token;
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (authHeader.startsWith('Bearer')) {
      // Handle case where Bearer is not followed by a space
      token = authHeader.substring(6).trim();
    } else {
      // If no Bearer prefix, try to use the whole header as token
      token = authHeader.trim();
    }
        
    if (!token) {
      console.error('No token found in Authorization header');
      return res.status(401).json({ success: false, error: 'No token provided' });
    }

    // Verify token
    const decoded = await verifyToken(token, 'access');
    
    // Get user from token
    const user = await User.findById(decoded.sub).select('-password');
    if (!user) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ success: false, error: 'User account is not active' });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: 'Token expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }
    res.status(401).json({ success: false, error: 'Not authorized' });
  }
};

export default protect;
