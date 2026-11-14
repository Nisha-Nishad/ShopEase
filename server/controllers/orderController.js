import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Cart from '../models/Cart.js';
import { verifyAndCalculateCoupon } from './couponController.js';
import sendEmail from '../utils/sendEmail.js';
import {
  generateInvoiceHTML,
  generateInvoicePDF,
  generateOrderEmailHTML,
} from '../utils/invoiceGenerator.js';

/**
 * @desc    Create a new order (Calculates prices on server & atomically deducts stock)
 * @route   POST /api/orders
 * @access  Private
 */
export const createOrder = async (req, res, next) => {
  const deductedItems = []; // Track deducted stock for rollback if any item fails

  try {
    const {
      orderItems,
      shippingAddress,
      paymentMethod = 'COD',
      couponCode,
    } = req.body;

    if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
      res.status(400);
      throw new Error('Your order contains no items');
    }

    if (
      !shippingAddress ||
      !shippingAddress.fullName ||
      !shippingAddress.phone ||
      !shippingAddress.street ||
      !shippingAddress.city ||
      !shippingAddress.state ||
      !shippingAddress.postalCode
    ) {
      res.status(400);
      throw new Error('Please provide a complete shipping address');
    }

    const verifiedOrderItems = [];
    let itemsPrice = 0;

    // 1. Verify each product, calculate real price on server, and atomically deduct stock
    for (const rawItem of orderItems) {
      const productId = rawItem.product?._id || rawItem.product || rawItem.productId;
      const qty = Math.max(1, Number(rawItem.qty || rawItem.quantity || 1));

      // Atomic update: only succeeds if stock >= qty (Prevents Overselling!)
      const updatedProduct = await Product.findOneAndUpdate(
        { _id: productId, stock: { $gte: qty } },
        { $inc: { stock: -qty } },
        { new: true }
      );

      if (!updatedProduct) {
        const checkProd = await Product.findById(productId);
        res.status(400);
        throw new Error(
          checkProd
            ? `Insufficient stock for "${checkProd.name}" (Only ${checkProd.stock} left)`
            : 'One of the products in your cart no longer exists'
        );
      }

      deductedItems.push({ productId: updatedProduct._id, qty });

      const unitPrice =
        updatedProduct.discountPrice && updatedProduct.discountPrice > 0
          ? updatedProduct.discountPrice
          : updatedProduct.price;

      itemsPrice += unitPrice * qty;

      verifiedOrderItems.push({
        product: updatedProduct._id,
        name: updatedProduct.name,
        price: unitPrice,
        qty,
        image: updatedProduct.images?.[0] || '',
        variant: {
          size: rawItem.variant?.size || '',
          color: rawItem.variant?.color || '',
        },
      });
    }

    // 2. Verify Coupon if provided
    let discount = 0;
    let appliedCouponDoc = null;
    if (couponCode && couponCode.trim()) {
      const couponResult = await verifyAndCalculateCoupon(
        couponCode,
        itemsPrice
      );
      discount = couponResult.discountAmount;
      appliedCouponDoc = couponResult.coupon;
    }

    // 3. Server-side Shipping & Tax Calculation
    const shippingPrice = itemsPrice >= 499 ? 0 : 49;
    const taxableAmount = Math.max(0, itemsPrice - discount);
    const taxPrice = Math.round(taxableAmount * 0.05); // 5% GST estimate
    const totalPrice = Math.max(0, taxableAmount + shippingPrice + taxPrice);

    // 4. Create Order Document
    const order = await Order.create({
      user: req.user._id,
      orderItems: verifiedOrderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      taxPrice,
      discount,
      couponCode: appliedCouponDoc ? appliedCouponDoc.code : '',
      totalPrice,
      orderStatus: 'Placed',
      isPaid: false,
    });

    // 5. Increment coupon usedCount if a coupon was used
    if (appliedCouponDoc) {
      appliedCouponDoc.usedCount += 1;
      await appliedCouponDoc.save();
    }

    // 6. Clear User's MongoDB Cart after placing order
    await Cart.findOneAndUpdate(
      { user: req.user._id },
      { $set: { items: [], totalPrice: 0 } }
    );

    // 7. Send Rich HTML Order Confirmation Email with PDF Tax Invoice Attached (non-blocking)
    const shortId = order._id.toString().slice(-8).toUpperCase();
    const invoiceNo = `INV-${shortId}`;
    let pdfAttachments = [];
    try {
      const pdfBuf = generateInvoicePDF(order);
      pdfAttachments = [
        {
          filename: `ShopEase_Receipt_${invoiceNo}.pdf`,
          content: pdfBuf,
          contentType: 'application/pdf',
        },
      ];
    } catch {
      pdfAttachments = [];
    }

    sendEmail({
      email: req.user.email,
      subject: `ShopEase Order Confirmed - #${shortId} (₹${order.totalPrice.toLocaleString('en-IN')})`,
      message: `Hi ${req.user.name},\n\nThank you for your order at ShopEase!\nOrder ID: #${shortId}\nInvoice No: ${invoiceNo}\nTotal Amount: ₹${order.totalPrice.toLocaleString('en-IN')}\nPayment Method: ${order.paymentMethod}\n\nYour official PDF Tax Invoice is attached to this email.`,
      html: generateOrderEmailHTML(order, {
        customerName: req.user.name,
        headline: 'Thank You for Your Order!',
        subheadline: `Hi ${req.user.name}, we've received your order #${shortId} and are getting it ready for dispatch.`,
      }),
      attachments: pdfAttachments,
    }).catch(() => {});

    res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      order,
    });
  } catch (error) {
    // Rollback any stock deductions if order creation failed partway through
    for (const item of deductedItems) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: item.qty },
      });
    }
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

/**
 * @desc    Get logged-in customer's order history
 * @route   GET /api/orders/my
 * @access  Private
 */
export const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single order by ID (Owner or Admin/Manager)
 * @route   GET /api/orders/:id
 * @access  Private
 */
export const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      'user',
      'name email phone'
    );

    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    // Ensure only the order owner or an admin/manager can view this order
    const isOwner = order.user._id.toString() === req.user._id.toString();
    const isStaff =
      req.user.role === 'admin' || req.user.role === 'manager';

    if (!isOwner && !isStaff) {
      res.status(403);
      throw new Error('Not authorized to view this order');
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cancel an order (Customer can cancel before Shipped) & restore stock
 * @route   PUT /api/orders/:id/cancel
 * @access  Private
 */
export const cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    const isOwner = order.user.toString() === req.user._id.toString();
    const isStaff =
      req.user.role === 'admin' || req.user.role === 'manager';

    if (!isOwner && !isStaff) {
      res.status(403);
      throw new Error('Not authorized to cancel this order');
    }

    if (order.orderStatus === 'Cancelled') {
      res.status(400);
      throw new Error('This order is already cancelled');
    }

    if (
      order.orderStatus === 'Shipped' ||
      order.orderStatus === 'Delivered'
    ) {
      res.status(400);
      throw new Error(
        `Cannot cancel an order that has already been ${order.orderStatus.toLowerCase()}`
      );
    }

    // Restore product stock atomically
    for (const item of order.orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.qty },
      });
    }

    order.orderStatus = 'Cancelled';
    order.cancelledAt = new Date();
    order.cancelReason = req.body?.reason || 'Cancelled by customer';

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order cancelled and product stock restored',
      order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update order status (Placed -> Packed -> Shipped -> Delivered / Cancelled)
 * @route   PUT /api/orders/:id/status
 * @access  Private (Admin / Manager)
 */
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { orderStatus } = req.body;
    const validStatuses = [
      'Placed',
      'Packed',
      'Shipped',
      'Delivered',
      'Cancelled',
    ];

    if (!validStatuses.includes(orderStatus)) {
      res.status(400);
      throw new Error('Invalid order status');
    }

    const order = await Order.findById(req.params.id).populate(
      'user',
      'name email'
    );
    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    // If changing to Cancelled from an active state, restore stock
    if (orderStatus === 'Cancelled' && order.orderStatus !== 'Cancelled') {
      for (const item of order.orderItems) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.qty },
        });
      }
      order.cancelledAt = new Date();
    }

    order.orderStatus = orderStatus;

    if (orderStatus === 'Delivered') {
      order.deliveredAt = new Date();
      if (order.paymentMethod === 'COD') {
        order.isPaid = true;
        order.paidAt = new Date();
      }
    }

    await order.save();

    // Send Rich HTML Shipping / Order Status Update Email Notification (non-blocking)
    if (order.user?.email) {
      const shortId = order._id.toString().slice(-8).toUpperCase();
      const invoiceNo = `INV-${shortId}`;
      let pdfAttachments = [];
      try {
        const pdfBuf = generateInvoicePDF(order);
        pdfAttachments = [
          {
            filename: `ShopEase_Receipt_${invoiceNo}.pdf`,
            content: pdfBuf,
            contentType: 'application/pdf',
          },
        ];
      } catch {
        pdfAttachments = [];
      }

      sendEmail({
        email: order.user.email,
        subject: `Order #${shortId} Status Update: ${orderStatus} - ShopEase`,
        message: `Hi ${order.user.name},\n\nYour ShopEase order #${shortId} status has been updated to: ${orderStatus}.\n\nThank you for shopping with ShopEase!`,
        html: generateOrderEmailHTML(order, {
          customerName: order.user.name,
          headline: `Order Update: ${orderStatus}`,
          subheadline: `Hi ${order.user.name}, your ShopEase order #${shortId} is now "${orderStatus}".`,
        }),
        attachments: pdfAttachments,
      }).catch(() => {});
    }

    res.status(200).json({
      success: true,
      message: `Order status updated to ${orderStatus}`,
      order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all orders (Admin / Manager)
 * @route   GET /api/orders
 * @access  Private (Admin / Manager)
 */
export const getAllOrders = async (req, res, next) => {
  try {
    const orders = await Order.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Generate & view printable/PDF Tax Invoice for an Order
 * @route   GET /api/orders/:id/invoice
 * @access  Private (Order Owner or Admin/Manager)
 */
export const getOrderInvoice = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      'user',
      'name email phone'
    );

    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    const isOwner = order.user._id.toString() === req.user._id.toString();
    const isStaff =
      req.user.role === 'admin' || req.user.role === 'manager';

    if (!isOwner && !isStaff) {
      res.status(403);
      throw new Error('Not authorized to access this invoice');
    }

    const invoiceNo = `INV-${order._id.toString().slice(-8).toUpperCase()}`;

    if (req.query.format === 'html') {
      const html = generateInvoiceHTML(order);
      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(html);
    }

    const pdfBuffer = generateInvoicePDF(order);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="ShopEase_Receipt_${invoiceNo}.pdf"`
    );
    res.setHeader('Content-Length', pdfBuffer.length);
    res.status(200).send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Submit a 7-Day Return / Refund or Replacement Request for a Delivered Order
 * @route   PUT /api/orders/:id/return
 * @access  Private (Customer / Order Owner)
 */
export const requestOrderReturn = async (req, res, next) => {
  try {
    const {
      type = 'Refund',
      reason,
      comments = '',
      refundMethod = 'Original Payment Method',
      refundUpiId = '',
    } = req.body;

    if (!reason || !reason.trim()) {
      res.status(400);
      throw new Error('Please select a reason for your return request');
    }

    const order = await Order.findById(req.params.id).populate(
      'user',
      'name email phone'
    );

    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    const isOwner =
      (order.user?._id || order.user).toString() === req.user._id.toString();
    const isStaff = req.user.role === 'admin' || req.user.role === 'manager';

    if (!isOwner && !isStaff) {
      res.status(403);
      throw new Error('Not authorized to request a return for this order');
    }

    if (order.orderStatus !== 'Delivered') {
      res.status(400);
      throw new Error(
        'Return or refund can only be requested after the order is Delivered'
      );
    }

    if (order.returnRequest?.isRequested) {
      res.status(400);
      throw new Error(
        `A ${order.returnRequest.type.toLowerCase()} request has already been submitted for this order`
      );
    }

    // Verify 7-Day Return Window from deliveredAt (fallback to updatedAt)
    const deliveredTimestamp = new Date(
      order.deliveredAt || order.updatedAt || order.createdAt
    ).getTime();
    const daysElapsed =
      (Date.now() - deliveredTimestamp) / (1000 * 60 * 60 * 24);

    if (daysElapsed > 7) {
      res.status(400);
      throw new Error(
        'The 7-day return & refund window for this delivered order has expired'
      );
    }

    order.returnRequest = {
      isRequested: true,
      status: 'Requested',
      type: type === 'Replacement' ? 'Replacement' : 'Refund',
      reason: reason.trim(),
      comments: comments.trim(),
      refundMethod: refundMethod.trim(),
      refundUpiId: refundUpiId.trim(),
      requestedAt: new Date(),
    };

    const updatedOrder = await order.save();

    if (order.user?.email) {
      sendEmail({
        email: order.user.email,
        subject: `ShopEase ${order.returnRequest.type} Request Received - Order #${order._id
          .toString()
          .slice(-8)
          .toUpperCase()}`,
        message: `Hi ${order.user.name},\n\nWe have received your 7-day ${order.returnRequest.type.toLowerCase()} request for Order #${order._id}.\nReason: ${order.returnRequest.reason}\nAmount: ₹${order.totalPrice}\nStatus: Requested (Under Review)\n\nOur team will process your request within 24-48 hours.`,
      }).catch(() => {});
    }

    res.status(200).json({
      success: true,
      message: `Your 7-day ${order.returnRequest.type.toLowerCase()} request has been submitted successfully!`,
      order: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Approve, Replace, or Reject a customer's Return / Refund Request
 * @route   PUT /api/orders/:id/return-status
 * @access  Private (Admin / Manager)
 */
export const updateReturnStatus = async (req, res, next) => {
  try {
    const { status, adminNote = '' } = req.body;
    const allowedStatuses = [
      'Requested',
      'Approved & Refunded',
      'Replacement Sent',
      'Rejected',
    ];

    if (!allowedStatuses.includes(status)) {
      res.status(400);
      throw new Error('Invalid return status');
    }

    const order = await Order.findById(req.params.id).populate(
      'user',
      'name email phone'
    );

    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    if (!order.returnRequest?.isRequested) {
      res.status(400);
      throw new Error('No return request exists for this order');
    }

    const previousStatus = order.returnRequest.status;
    order.returnRequest.status = status;
    order.returnRequest.adminNote = adminNote;

    if (
      status === 'Approved & Refunded' ||
      status === 'Replacement Sent' ||
      status === 'Rejected'
    ) {
      order.returnRequest.resolvedAt = new Date();
    }

    // Restore stock if Approved & Refunded for the first time
    if (
      status === 'Approved & Refunded' &&
      previousStatus !== 'Approved & Refunded'
    ) {
      for (const item of order.orderItems) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.qty },
        });
      }
    }

    const updatedOrder = await order.save();

    if (order.user?.email) {
      sendEmail({
        email: order.user.email,
        subject: `Order #${order._id
          .toString()
          .slice(-8)
          .toUpperCase()} Return Update: ${status}`,
        message: `Hi ${order.user.name},\n\nYour return/refund request for ShopEase Order #${order._id} has been updated to: ${status}.\n\nThank you for shopping with ShopEase!`,
      }).catch(() => {});
    }

    res.status(200).json({
      success: true,
      message: `Return request status updated to "${status}"`,
      order: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
};
