import express from 'express';
import {
  getProducts,
  getSearchSuggestions,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImages,
} from '../controllers/productController.js';
import {
  getProductReviews,
  createOrUpdateReview,
  deleteReview,
} from '../controllers/reviewController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { uploadImages } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Public routes
router.get('/suggestions', getSearchSuggestions);
router.get('/', getProducts);
router.get('/:id', getProductById);

// Product Reviews routes (Verified buyers & moderation)
router
  .route('/:id/reviews')
  .get(getProductReviews)
  .post(protect, createOrUpdateReview);
router.delete('/:id/reviews/:reviewId', protect, deleteReview);

// Admin & Manager protected routes
router.post(
  '/upload',
  protect,
  authorize('admin', 'manager'),
  uploadImages.array('images', 5),
  uploadProductImages
);
router.post('/', protect, authorize('admin', 'manager'), createProduct);
router.put('/:id', protect, authorize('admin', 'manager'), updateProduct);
router.delete('/:id', protect, authorize('admin'), deleteProduct);

export default router;
