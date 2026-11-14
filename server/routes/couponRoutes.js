import express from 'express';
import {
  applyCoupon,
  getCoupons,
  createCoupon,
  deleteCoupon,
} from '../controllers/couponController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Customer route to apply coupon at checkout
router.post('/apply', protect, applyCoupon);

// Admin routes for coupon management
router
  .route('/')
  .get(protect, authorize('admin', 'manager'), getCoupons)
  .post(protect, authorize('admin', 'manager'), createCoupon);

router.delete('/:id', protect, authorize('admin'), deleteCoupon);

export default router;
