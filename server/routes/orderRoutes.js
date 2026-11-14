import express from 'express';
import {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  requestOrderReturn,
  updateReturnStatus,
  updateOrderStatus,
  getAllOrders,
  getOrderInvoice,
} from '../controllers/orderController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .post(createOrder)
  .get(authorize('admin', 'manager'), getAllOrders);

router.get('/my', getMyOrders);
router.get('/:id/invoice', getOrderInvoice);
router.get('/:id', getOrderById);
router.put('/:id/cancel', cancelOrder);
router.put('/:id/return', requestOrderReturn);
router.put(
  '/:id/return-status',
  authorize('admin', 'manager'),
  updateReturnStatus
);
router.put('/:id/status', authorize('admin', 'manager'), updateOrderStatus);

export default router;
