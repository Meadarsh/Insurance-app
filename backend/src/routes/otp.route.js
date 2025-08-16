import express from 'express';
import { body } from 'express-validator';
import validate from '../middleware/validate.js';
import otpController from '../controllers/otp.controller.js';

const router = express.Router();

router.post(
  '/send',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('type').optional().isIn(['signup', 'login', 'reset', 'verification']),
  ],
  validate,
  otpController.sendOtp
);

router.post(
  '/verify',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('otp')
      .isLength({ min: 6, max: 6 })
      .withMessage('OTP must be 6 digits'),
    body('type').optional().isIn(['signup', 'login', 'reset', 'verification']),
  ],
  validate,
  otpController.verifyOtp
);

router.post(
  '/verify',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('otp')
      .isLength({ min: 6, max: 6 })
      .withMessage('OTP must be 6 digits'),
    body('type').optional().isIn(['signup', 'login', 'reset', 'verification']),
  ],
  validate,
  otpController.verifyOtp
);

export default router;
