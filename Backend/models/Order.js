import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    qty: { type: Number, required: true, min: 1 },
    image: { type: String, default: '' },
    variant: {
      size: { type: String, default: '' },
      color: { type: String, default: '' },
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    orderItems: [orderItemSchema],
    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, default: 'India' },
    },
    paymentMethod: {
      type: String,
      enum: ['COD', 'Razorpay'],
      required: true,
      default: 'COD',
    },
    paymentResult: {
      id: { type: String },
      orderId: { type: String },
      signature: { type: String },
      status: { type: String },
      channel: { type: String },
      payerVpa: { type: String },
    },
    itemsPrice: {
      type: Number,
      required: true,
      default: 0,
    },
    shippingPrice: {
      type: Number,
      required: true,
      default: 0,
    },
    taxPrice: {
      type: Number,
      required: true,
      default: 0,
    },
    discount: {
      type: Number,
      required: true,
      default: 0,
    },
    couponCode: {
      type: String,
      default: '',
    },
    totalPrice: {
      type: Number,
      required: true,
      default: 0,
    },
    orderStatus: {
      type: String,
      enum: ['Placed', 'Packed', 'Shipped', 'Delivered', 'Cancelled'],
      default: 'Placed',
      index: true,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    paidAt: {
      type: Date,
    },
    deliveredAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    cancelReason: {
      type: String,
      default: '',
    },
    returnRequest: {
      isRequested: { type: Boolean, default: false },
      status: {
        type: String,
        enum: [
          'None',
          'Requested',
          'Approved & Refunded',
          'Replacement Sent',
          'Rejected',
        ],
        default: 'None',
      },
      type: {
        type: String,
        enum: ['Refund', 'Replacement'],
        default: 'Refund',
      },
      reason: { type: String, default: '' },
      comments: { type: String, default: '' },
      refundMethod: { type: String, default: 'Original Payment Method' },
      refundUpiId: { type: String, default: '' },
      requestedAt: { type: Date },
      resolvedAt: { type: Date },
      adminNote: { type: String, default: '' },
    },
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model('Order', orderSchema);

export default Order;
