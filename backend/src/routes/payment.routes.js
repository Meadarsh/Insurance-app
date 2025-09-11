import express from 'express';
import {
  createPaymentIntent,
  handleWebhook,
  getPaymentHistory,
  createCheckoutSession,
  confirmPaymentSuccess,
} from '../controllers/payment.controller.js';
import protect from '../middleware/auth.js';

const router = express.Router();

router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

router.use(protect);

router.post('/create-payment-intent', createPaymentIntent);
router.post('/create-checkout-session', createCheckoutSession);

router.get('/history/:userId', getPaymentHistory);

// Public endpoint for confirming successful payments
router.get('/success', confirmPaymentSuccess);

export default router;
