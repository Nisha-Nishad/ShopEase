import Wishlist from '../models/Wishlist.js';

/**
 * @desc    Get logged-in user's wishlist
 * @route   GET /api/wishlist
 * @access  Private
 */
export const getWishlist = async (req, res, next) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user._id }).populate({
      path: 'products',
      select: 'name slug price discountPrice images stock ratings numReviews brand category',
      populate: { path: 'category', select: 'name slug' },
    });

    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user._id, products: [] });
    }

    res.status(200).json({
      success: true,
      products: wishlist.products.filter(Boolean),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle a product in/out of the user's wishlist
 * @route   POST /api/wishlist/toggle
 * @access  Private
 */
export const toggleWishlistItem = async (req, res, next) => {
  try {
    const { productId } = req.body;
    if (!productId) {
      res.status(400);
      throw new Error('productId is required');
    }

    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      wishlist = new Wishlist({ user: req.user._id, products: [] });
    }

    const existsIndex = wishlist.products.findIndex(
      (id) => id.toString() === productId.toString()
    );

    let action = 'added';
    if (existsIndex > -1) {
      wishlist.products.splice(existsIndex, 1);
      action = 'removed';
    } else {
      wishlist.products.push(productId);
    }

    await wishlist.save();
    await wishlist.populate({
      path: 'products',
      select: 'name slug price discountPrice images stock ratings numReviews brand category',
      populate: { path: 'category', select: 'name slug' },
    });

    res.status(200).json({
      success: true,
      action,
      message:
        action === 'added'
          ? 'Added to your wishlist'
          : 'Removed from your wishlist',
      products: wishlist.products.filter(Boolean),
    });
  } catch (error) {
    next(error);
  }
};
