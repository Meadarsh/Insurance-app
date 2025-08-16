import express from 'express';
import { body } from 'express-validator';
import validate from '../middleware/validate';
import otpController from '../controllers/otp.controller';

const router = express.Router();

/**
 * @swagger
 * /otp/send:
 *   post:
 *     summary: Send OTP to email
 *     tags: [OTP]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               type:
 *                 type: string
 *                 enum: [signup, login, reset, verification]
 *                 default: verification
 *     responses:
 *       200:
 *         description: OTP sent successfully
 */
router.post(
  '/send',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('type').optional().isIn(['signup', 'login', 'reset', 'verification']),
  ],
  validate,
  otpController.sendOtp
);

/**
 * @swagger
 * /otp/verify:
 *   post:
 *     summary: Verify OTP
 *     tags: [OTP]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               otp:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 6
 *               type:
 *                 type: string
 *                 enum: [signup, login, reset, verification]
 *                 default: verification
 *     responses:
 *       200:
 *         description: OTP verified successfully
 */
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
