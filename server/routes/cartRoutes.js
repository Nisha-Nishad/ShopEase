import express from 'express';
import {
  getCart,
  addToCart,
  mergeGuestCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} from '../controllers/cartController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All server-side cart routes require authentication
// (Guest users store cart in localStorage until login, then call /api/cart/merge)
router.use(protect);

router.route('/').get(getCart).post(addToCart).delete(clearCart);
router.post('/merge', mergeGuestCart);
router.route('/:itemId').put(updateCartItem).delete(removeCartItem);

export default router;
