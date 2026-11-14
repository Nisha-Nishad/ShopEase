import express from 'express';
import {
  getDashboardStats,
  getAllUsers,
  updateUserRoleOrStatus,
  exportSalesReportCSV,
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/stats', authorize('admin', 'manager'), getDashboardStats);
router.get('/users', authorize('admin', 'manager'), getAllUsers);
router.put('/users/:id', authorize('admin'), updateUserRoleOrStatus);
router.get('/reports/sales', authorize('admin', 'manager'), exportSalesReportCSV);

export default router;
