import express from 'express';
import { body } from 'express-validator';
import validate from '../middleware/validate.js';
import authController from '../controllers/auth.controller.js';
import protect from '../middleware/auth.js';

const router = express.Router();

router.post(
  '/register',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/[0-9]/)
      .withMessage('Password must contain a number')
      .matches(/[a-z]/)
      .withMessage('Password must contain a lowercase letter')
      .matches(/[A-Z]/)
      .withMessage('Password must contain an uppercase letter'),
    body('role').optional().isIn(['admin', 'vendor', 'executor']),
  ],
  validate,
  authController.register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  authController.login
);

router.post(
  '/refresh-token',
  [
    body('refreshToken').notEmpty().withMessage('Refresh token is required'),
  ],
  validate,
  authController.refreshAuth
);

router.get(
  '/me',
  protect, 
  authController.getCurrentUser
);


export default router;
