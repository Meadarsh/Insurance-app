import express from 'express';
import { body } from 'express-validator';
import validate from '../middleware/validate.js';
import protect from '../middleware/auth.js';
import {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUsersCount,
} from '../controllers/user.controller.js';

const router = express.Router();

// All routes are protected with authentication
router.use(protect);

// Get all users
router.get('/', getUsers);

// Get users count for analytics
router.get('/count', getUsersCount);

// Get user by ID
router.get('/:id', getUserById);

// Update user
router.put('/:id', [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Please provide a valid email'),
  body('role').optional().isIn(['admin', 'vendor', 'executor']).withMessage('Invalid role'),
  body('isVerified').optional().isBoolean().withMessage('isVerified must be a boolean'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
], validate, updateUser);

// Delete user
router.delete('/:id', deleteUser);

export default router;
