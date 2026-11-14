import Review from '../models/Review.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';

/**
 * @desc    Get all reviews for a product
 * @route   GET /api/products/:id/reviews
 * @access  Public
 */
export const getProductReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ product: req.params.id })
      .populate('user', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      reviews,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create or update a product review (Verified Buyers Only)
 * @route   POST /api/products/:id/reviews
 * @access  Private
 */
export const createOrUpdateReview = async (req, res, next) => {
  try {
    const productId = req.params.id;
    const { rating, comment } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }

    // 1. Check if the logged-in user is a Verified Buyer of this product
    const hasPurchased = await Order.findOne({
      user: req.user._id,
      'orderItems.product': productId,
      orderStatus: { $ne: 'Cancelled' },
    });

    if (!hasPurchased && req.user.role !== 'admin') {
      res.status(403);
      throw new Error(
        'Only verified buyers who have purchased this product can write a review.'
      );
    }

    // 2. Create new review or update existing review by the same user
    let review = await Review.findOne({
      product: productId,
      user: req.user._id,
    });

    if (review) {
      review.rating = Number(rating);
      review.comment = comment;
      await review.save();
    } else {
      review = await Review.create({
        user: req.user._id,
        product: productId,
        rating: Number(rating),
        comment,
        isVerifiedPurchase: true,
      });
    }

    // 3. Recalculate Product average rating & numReviews
    await Review.calcAverageRatings(productId);

    const reviews = await Review.find({ product: productId })
      .populate('user', 'name')
      .sort({ createdAt: -1 });

    res.status(201).json({
      success: true,
      message: 'Thank you! Your verified review has been saved.',
      reviews,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a review (Review Author or Admin/Manager moderation)
 * @route   DELETE /api/products/:id/reviews/:reviewId
 * @access  Private
 */
export const deleteReview = async (req, res, next) => {
  try {
    const { id: productId, reviewId } = req.params;

    const review = await Review.findById(reviewId);
    if (!review) {
      res.status(404);
      throw new Error('Review not found');
    }

    const isAuthor = review.user.toString() === req.user._id.toString();
    const isStaff =
      req.user.role === 'admin' || req.user.role === 'manager';

    if (!isAuthor && !isStaff) {
      res.status(403);
      throw new Error('Not authorized to delete this review');
    }

    await review.deleteOne();
    await Review.calcAverageRatings(productId);

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
