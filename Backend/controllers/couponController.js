import Coupon from '../models/Coupon.js';

/**
 * Reusable helper: Validates a coupon code against an order's itemsPrice
 * and returns { coupon, discountAmount }.
 */
export const verifyAndCalculateCoupon = async (code, itemsPrice) => {
  const cleanCode = (code || '').trim().toUpperCase();
  const coupon = await Coupon.findOne({ code: cleanCode, isActive: true });

  if (!coupon) {
    const err = new Error('Invalid or inactive coupon code');
    err.statusCode = 400;
    throw err;
  }

  if (new Date(coupon.expiryDate) < new Date()) {
    const err = new Error('This coupon has expired');
    err.statusCode = 400;
    throw err;
  }

  if (coupon.usedCount >= coupon.usageLimit) {
    const err = new Error('This coupon has reached its maximum usage limit');
    err.statusCode = 400;
    throw err;
  }

  if (itemsPrice < coupon.minOrderValue) {
    const err = new Error(
      `Minimum order value of ₹${coupon.minOrderValue} is required for coupon ${coupon.code}`
    );
    err.statusCode = 400;
    throw err;
  }

  let discountAmount = 0;
  if (coupon.discountType === 'percent') {
    discountAmount = Math.round((itemsPrice * coupon.value) / 100);
    if (coupon.maxDiscount && coupon.maxDiscount > 0) {
      discountAmount = Math.min(discountAmount, coupon.maxDiscount);
    }
  } else {
    discountAmount = coupon.value;
  }

  discountAmount = Math.min(discountAmount, itemsPrice);

  return { coupon, discountAmount };
};

/**
 * @desc    Apply & validate a coupon code at checkout
 * @route   POST /api/coupons/apply
 * @access  Private
 */
export const applyCoupon = async (req, res, next) => {
  try {
    const { code, itemsPrice } = req.body;
    if (!code) {
      res.status(400);
      throw new Error('Please enter a coupon code');
    }

    const { coupon, discountAmount } = await verifyAndCalculateCoupon(
      code,
      Number(itemsPrice) || 0
    );

    res.status(200).json({
      success: true,
      message: `Coupon ${coupon.code} applied! You saved ₹${discountAmount}`,
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        value: coupon.value,
        discountAmount,
      },
    });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

/**
 * @desc    Get all coupons (Admin)
 * @route   GET /api/coupons
 * @access  Private (Admin / Manager)
 */
export const getCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      coupons,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new coupon (Admin)
 * @route   POST /api/coupons
 * @access  Private (Admin / Manager)
 */
export const createCoupon = async (req, res, next) => {
  try {
    const {
      code,
      discountType,
      value,
      minOrderValue,
      maxDiscount,
      expiryDate,
      usageLimit,
    } = req.body;

    const existing = await Coupon.findOne({ code: code.trim().toUpperCase() });
    if (existing) {
      res.status(400);
      throw new Error('A coupon with this code already exists');
    }

    const coupon = await Coupon.create({
      code: code.trim().toUpperCase(),
      discountType,
      value: Number(value),
      minOrderValue: Number(minOrderValue) || 0,
      maxDiscount: Number(maxDiscount) || 0,
      expiryDate,
      usageLimit: Number(usageLimit) || 100,
    });

    res.status(201).json({
      success: true,
      message: 'Coupon created successfully',
      coupon,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a coupon (Admin)
 * @route   DELETE /api/coupons/:id
 * @access  Private (Admin)
 */
export const deleteCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      res.status(404);
      throw new Error('Coupon not found');
    }

    await coupon.deleteOne();
    res.status(200).json({
      success: true,
      message: 'Coupon deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
