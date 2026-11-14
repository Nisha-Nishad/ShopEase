import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

/**
 * Helper: Populates cart items with product details and recalculates totalPrice
 * strictly on the server (Security Rule #4: Never trust frontend prices).
 */
const populateAndCalculateCart = async (cart) => {
  await cart.populate({
    path: 'items.product',
    select: 'name slug price discountPrice images stock variants brand',
  });

  // Remove any items whose product was deleted from the database
  cart.items = cart.items.filter((item) => item.product !== null);

  // Calculate totalPrice using actual database prices
  cart.totalPrice = cart.items.reduce((sum, item) => {
    const unitPrice =
      item.product.discountPrice && item.product.discountPrice > 0
        ? item.product.discountPrice
        : item.product.price;
    return sum + unitPrice * item.quantity;
  }, 0);

  await cart.save();
  return cart;
};

/**
 * @desc    Get logged-in user's cart
 * @route   GET /api/cart
 * @access  Private
 */
export const getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [], totalPrice: 0 });
    }

    cart = await populateAndCalculateCart(cart);

    res.status(200).json({
      success: true,
      cart,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add item to cart (or increment quantity if same product + variant exists)
 * @route   POST /api/cart
 * @access  Private
 */
export const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1, variant = {} } = req.body;
    const size = variant.size || '';
    const color = variant.color || '';

    const product = await Product.findById(productId);
    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }

    if (product.stock <= 0) {
      res.status(400);
      throw new Error('This product is currently out of stock');
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    // Check if the exact same product + variant (size & color) is already in the cart
    const existingIndex = cart.items.findIndex(
      (item) =>
        item.product.toString() === productId &&
        (item.variant?.size || '') === size &&
        (item.variant?.color || '') === color
    );

    const qtyToAdd = Math.max(1, Number(quantity) || 1);

    if (existingIndex > -1) {
      const newQty = Math.min(
        product.stock,
        cart.items[existingIndex].quantity + qtyToAdd
      );
      cart.items[existingIndex].quantity = newQty;
    } else {
      cart.items.push({
        product: productId,
        quantity: Math.min(product.stock, qtyToAdd),
        variant: { size, color },
      });
    }

    cart = await populateAndCalculateCart(cart);

    res.status(200).json({
      success: true,
      message: 'Added to cart',
      cart,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Merge guest localStorage cart items into user's DB cart upon login
 * @route   POST /api/cart/merge
 * @access  Private
 */
export const mergeGuestCart = async (req, res, next) => {
  try {
    const { items = [] } = req.body;

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    for (const guestItem of items) {
      const productId = guestItem.product?._id || guestItem.product || guestItem.productId;
      if (!productId) continue;

      const product = await Product.findById(productId);
      if (!product || product.stock <= 0) continue;

      const size = guestItem.variant?.size || '';
      const color = guestItem.variant?.color || '';
      const qty = Math.max(1, Number(guestItem.quantity) || 1);

      const existingIndex = cart.items.findIndex(
        (item) =>
          item.product.toString() === productId.toString() &&
          (item.variant?.size || '') === size &&
          (item.variant?.color || '') === color
      );

      if (existingIndex > -1) {
        cart.items[existingIndex].quantity = Math.min(
          product.stock,
          cart.items[existingIndex].quantity + qty
        );
      } else {
        cart.items.push({
          product: product._id,
          quantity: Math.min(product.stock, qty),
          variant: { size, color },
        });
      }
    }

    cart = await populateAndCalculateCart(cart);

    res.status(200).json({
      success: true,
      message: 'Guest cart merged successfully',
      cart,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update quantity of a specific cart item
 * @route   PUT /api/cart/:itemId
 * @access  Private
 */
export const updateCartItem = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    const { itemId } = req.params;

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      res.status(404);
      throw new Error('Cart not found');
    }

    const item = cart.items.id(itemId);
    if (!item) {
      res.status(404);
      throw new Error('Item not found in cart');
    }

    const product = await Product.findById(item.product);
    const maxStock = product ? product.stock : 99;

    if (Number(quantity) <= 0) {
      item.deleteOne();
    } else {
      item.quantity = Math.min(maxStock, Math.max(1, Number(quantity)));
    }

    cart = await populateAndCalculateCart(cart);

    res.status(200).json({
      success: true,
      message: 'Cart updated',
      cart,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Remove a specific item from cart
 * @route   DELETE /api/cart/:itemId
 * @access  Private
 */
export const removeCartItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      res.status(404);
      throw new Error('Cart not found');
    }

    cart.items = cart.items.filter(
      (item) => item._id.toString() !== itemId.toString()
    );

    cart = await populateAndCalculateCart(cart);

    res.status(200).json({
      success: true,
      message: 'Item removed from cart',
      cart,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Clear entire cart
 * @route   DELETE /api/cart
 * @access  Private
 */
export const clearCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id });
    if (cart) {
      cart.items = [];
      cart.totalPrice = 0;
      await cart.save();
    }

    res.status(200).json({
      success: true,
      message: 'Cart cleared',
      cart: cart || { items: [], totalPrice: 0 },
    });
  } catch (error) {
    next(error);
  }
};
