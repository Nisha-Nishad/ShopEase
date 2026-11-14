import express from 'express';
import {
  createPaymentOrder,
  verifyPayment,
  handleRazorpayWebhook,
} from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protected customer routes for initiating and verifying Razorpay checkout
router.post('/create-order', protect, createPaymentOrder);
router.post('/verify', protect, verifyPayment);

// Public server-to-server webhook route (verified via HMAC signature header)
router.post('/webhook', handleRazorpayWebhook);

export default router;
