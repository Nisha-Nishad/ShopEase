import crypto from 'crypto';
import Order from '../models/Order.js';
import {
  getRazorpayInstance,
  isRazorpayConfigured,
} from '../config/razorpay.js';
import sendEmail from '../utils/sendEmail.js';
import {
  generateInvoicePDF,
  generateOrderEmailHTML,
} from '../utils/invoiceGenerator.js';

const getSigningSecret = () =>
  isRazorpayConfigured()
    ? process.env.RAZORPAY_KEY_SECRET
    : 'shopease_dev_razorpay_secret_2026';

/**
 * @desc    Create a Razorpay payment order for a ShopEase order
 * @route   POST /api/payment/create-order
 * @access  Private
 */
export const createPaymentOrder = async (req, res, next) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findById(orderId).populate(
      'user',
      'name email phone'
    );
    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    if (
      (order.user?._id || order.user).toString() !== req.user._id.toString()
    ) {
      res.status(403);
      throw new Error('Not authorized to pay for this order');
    }

    if (order.isPaid) {
      res.status(400);
      throw new Error('This order has already been paid');
    }

    // Razorpay expects amount in smallest currency subunit (paise: ₹1 = 100 paise)
    const amountInPaise = Math.round(order.totalPrice * 100);
    const razorpay = getRazorpayInstance();

    // 1. Live / Test Razorpay SDK Mode (when RAZORPAY_KEY_ID is configured in .env)
    if (razorpay) {
      const rzpOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `receipt_${order._id}`,
        notes: {
          shopEaseOrderId: order._id.toString(),
          userId: req.user._id.toString(),
        },
      });

      return res.status(200).json({
        success: true,
        isSimulated: false,
        keyId: process.env.RAZORPAY_KEY_ID,
        razorpayOrder: rzpOrder,
      });
    }

    // 2. Local Simulated Test Mode (when Razorpay keys are not set yet in .env)
    const simulatedOrderId = `order_sim_${crypto.randomBytes(6).toString('hex')}`;
    const simulatedPaymentId = `pay_sim_${crypto.randomBytes(6).toString('hex')}`;
    const simulatedSignature = crypto
      .createHmac('sha256', getSigningSecret())
      .update(`${simulatedOrderId}|${simulatedPaymentId}`)
      .digest('hex');

    res.status(200).json({
      success: true,
      isSimulated: true,
      keyId: 'rzp_test_simulated',
      merchantUpiId: (process.env.MERCHANT_UPI_ID || '').trim(),
      merchantName: (process.env.MERCHANT_NAME || 'ShopEase Store').trim(),
      razorpayOrder: {
        id: simulatedOrderId,
        amount: amountInPaise,
        currency: 'INR',
        receipt: `receipt_${order._id}`,
      },
      simulatedPaymentPayload: {
        razorpay_order_id: simulatedOrderId,
        razorpay_payment_id: simulatedPaymentId,
        razorpay_signature: simulatedSignature,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify Razorpay Payment Signature (HMAC SHA-256) & mark order as paid
 * @route   POST /api/payment/verify
 * @access  Private
 */
export const verifyPayment = async (req, res, next) => {
  try {
    const {
      orderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      paymentChannel,
      payerVpa,
    } = req.body;

    if (
      !orderId ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      res.status(400);
      throw new Error('Missing payment verification parameters');
    }

    const order = await Order.findById(orderId).populate(
      'user',
      'name email phone'
    );
    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    // Security Rule #3: Cryptographically verify payment signature on the backend
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', getSigningSecret())
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      res.status(400);
      throw new Error('Payment verification failed: Invalid cryptographic signature');
    }

    // Signature is authentic! Mark order as Paid
    order.isPaid = true;
    order.paidAt = new Date();
    order.paymentMethod = 'Razorpay';
    order.paymentResult = {
      id: razorpay_payment_id,
      orderId: razorpay_order_id,
      signature: razorpay_signature,
      status: 'captured',
      channel: paymentChannel || 'Razorpay Online',
      payerVpa: payerVpa || '',
    };

    const updatedOrder = await order.save();

    // Send Rich HTML Payment Receipt & Order Confirmation Email with Paid PDF Invoice attached
    const recipientEmail = order.user?.email || req.user?.email;
    const recipientName =
      order.user?.name || req.user?.name || order.shippingAddress?.fullName;
    if (recipientEmail) {
      const shortId = updatedOrder._id.toString().slice(-8).toUpperCase();
      const invoiceNo = `INV-${shortId}`;
      let pdfAttachments = [];
      try {
        const pdfBuf = generateInvoicePDF(updatedOrder);
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
        email: recipientEmail,
        subject: `Payment Received (₹${updatedOrder.totalPrice.toLocaleString('en-IN')}) - Order #${shortId} Confirmed`,
        message: `Hi ${recipientName},\n\nYour payment of ₹${updatedOrder.totalPrice.toLocaleString('en-IN')} via ${updatedOrder.paymentResult.channel} for ShopEase Order #${shortId} is confirmed!\n\nYour PAID PDF Tax Invoice (${invoiceNo}) is attached to this email.`,
        html: generateOrderEmailHTML(updatedOrder, {
          customerName: recipientName,
          headline: 'Payment Successful & Order Confirmed!',
          subheadline: `Hi ${recipientName}, we've received your online payment of ₹${updatedOrder.totalPrice.toLocaleString('en-IN')} via ${updatedOrder.paymentResult.channel} for Order #${shortId}.`,
        }),
        attachments: pdfAttachments,
      }).catch(() => {});
    }

    res.status(200).json({
      success: true,
      message: 'Payment verified and order marked as Paid!',
      order: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Razorpay Webhook Handler (Asynchronous server-to-server payment confirmation)
 * @route   POST /api/payment/webhook
 * @access  Public (Verified via x-razorpay-signature header)
 */
export const handleRazorpayWebhook = async (req, res, next) => {
  try {
    const webhookSecret =
      process.env.RAZORPAY_WEBHOOK_SECRET || 'shopease_webhook_secret';
    const receivedSignature = req.headers['x-razorpay-signature'];

    if (!receivedSignature) {
      res.status(400);
      throw new Error('Missing x-razorpay-signature header');
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (expectedSignature !== receivedSignature) {
      res.status(400);
      throw new Error('Invalid webhook signature');
    }

    const event = req.body.event;
    if (event === 'payment.captured') {
      const paymentEntity = req.body.payload?.payment?.entity;
      const shopEaseOrderId = paymentEntity?.notes?.shopEaseOrderId;

      if (shopEaseOrderId) {
        const order = await Order.findById(shopEaseOrderId);
        if (order && !order.isPaid) {
          order.isPaid = true;
          order.paidAt = new Date();
          order.paymentResult = {
            id: paymentEntity.id,
            orderId: paymentEntity.order_id,
            status: paymentEntity.status,
          };
          await order.save();
        }
      }
    }

    res.status(200).json({ success: true, received: true });
  } catch (error) {
    next(error);
  }
};
