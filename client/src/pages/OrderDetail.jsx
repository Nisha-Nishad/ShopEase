import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../services/api';
import { formatPrice } from '../utils/formatPrice';
import { initiateRazorpayPayment } from '../utils/razorpayCheckout';
import { downloadOrderReceipt } from '../utils/downloadReceipt';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  MapPin,
  CreditCard,
  Package,
  Download,
  RotateCcw,
  ShieldAlert,
} from 'lucide-react';

const STEPS = ['Placed', 'Packed', 'Shipped', 'Delivered'];
const RETURN_REASONS = [
  'Damaged or defective product received',
  'Wrong item or wrong size/color delivered',
  'Product quality not as expected',
  'Missing accessories or parts in package',
  'Changed my mind / Ordered by mistake',
];

const OrderDetail = () => {
  const { id } = useParams();
  const { user } = useSelector((state) => state.auth);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [paying, setPaying] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  // 7-Day Return / Refund Request State
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [returnType, setReturnType] = useState('Refund');
  const [returnReason, setReturnReason] = useState(RETURN_REASONS[0]);
  const [returnComments, setReturnComments] = useState('');
  const [refundMethod, setRefundMethod] = useState('Instant UPI Refund (PhonePe / GPay)');
  const [refundUpiId, setRefundUpiId] = useState('');
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const [returnError, setReturnError] = useState('');
  const [returnSuccess, setReturnSuccess] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const { data } = await api.get(`/orders/${id}`);
        setOrder(data.order);
      } catch (err) {
        setError(err.response?.data?.message || 'Order not found');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    setCancelling(true);
    try {
      const { data } = await api.put(`/orders/${id}/cancel`, {
        reason: 'Cancelled by customer from Order Details page',
      });
      setOrder(data.order);
    } catch (err) {
      alert(err.response?.data?.message || 'Could not cancel order');
    } finally {
      setCancelling(false);
    }
  };

  const handlePayOnline = async () => {
    setPaying(true);
    await initiateRazorpayPayment({
      order,
      user,
      onSuccess: (updatedOrder) => {
        setOrder(updatedOrder);
        setPaying(false);
      },
      onError: (msg) => {
        alert(msg);
        setPaying(false);
      },
    });
  };

  const handleDownloadReceipt = async () => {
    if (!order) return;
    setDownloading(true);
    try {
      await downloadOrderReceipt(order);
    } finally {
      setDownloading(false);
    }
  };

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    setReturnError('');
    setReturnSuccess('');

    if (
      returnType === 'Refund' &&
      refundMethod.includes('UPI') &&
      !refundUpiId.trim()
    ) {
      setReturnError(
        'Please enter your PhonePe / GPay UPI ID or 10-digit mobile number for instant refund.'
      );
      return;
    }

    setSubmittingReturn(true);
    try {
      const { data } = await api.put(`/orders/${id}/return`, {
        type: returnType,
        reason: returnReason,
        comments: returnComments,
        refundMethod:
          returnType === 'Replacement'
            ? 'Free Doorstep Replacement'
            : refundMethod,
        refundUpiId: returnType === 'Refund' ? refundUpiId.trim() : '',
      });
      setOrder(data.order);
      setReturnSuccess(data.message);
      setShowReturnForm(false);
    } catch (err) {
      setReturnError(
        err.response?.data?.message || 'Could not submit return request'
      );
    } finally {
      setSubmittingReturn(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">
          {error || 'Order not found'}
        </h2>
        <Link
          to="/orders"
          className="inline-block bg-indigo-600 text-white font-semibold px-6 py-2.5 rounded-xl"
        >
          Back to My Orders
        </Link>
      </div>
    );
  }

  const currentStepIndex = STEPS.indexOf(order.orderStatus);
  const canCancel =
    order.orderStatus === 'Placed' || order.orderStatus === 'Packed';

  // Calculate 7-Day Return Eligibility for Delivered orders
  const deliveredDate = new Date(
    order.deliveredAt || order.updatedAt || order.createdAt
  );
  const daysSinceDelivery =
    (Date.now() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24);
  const daysRemainingForReturn = Math.max(
    0,
    Math.ceil(7 - daysSinceDelivery)
  );
  const canRequestReturn =
    order.orderStatus === 'Delivered' &&
    !order.returnRequest?.isRequested &&
    daysSinceDelivery <= 7;

  return (
    <div className="py-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            to="/orders"
            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to My Orders</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">
            Order #{order._id.slice(-8).toUpperCase()}
          </h1>
          <p className="text-xs text-slate-500">
            Placed on{' '}
            {new Date(order.createdAt).toLocaleString('en-IN', {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            disabled={downloading}
            onClick={handleDownloadReceipt}
            className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>
              {downloading ? 'Downloading...' : 'Download Receipt (PDF)'}
            </span>
          </button>

          {canCancel && (
            <button
              type="button"
              disabled={cancelling}
              onClick={handleCancelOrder}
              className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
            >
              {cancelling ? 'Cancelling...' : 'Cancel Order'}
            </button>
          )}

          {canRequestReturn && (
            <button
              type="button"
              onClick={() => setShowReturnForm((prev) => !prev)}
              className="inline-flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>
                Request Return / Refund ({daysRemainingForReturn}d left)
              </span>
            </button>
          )}
        </div>
      </div>

      {/* 7-Day Return / Refund Status Banner OR Request Form */}
      {returnSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{returnSuccess}</span>
        </div>
      )}

      {order.returnRequest?.isRequested && (
        <div className="bg-white rounded-2xl border border-amber-200 p-5 sm:p-6 space-y-3 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  7-Day {order.returnRequest.type} Request
                </h2>
                <p className="text-xs text-slate-500">
                  Requested on{' '}
                  {new Date(order.returnRequest.requestedAt).toLocaleString(
                    'en-IN',
                    { dateStyle: 'medium', timeStyle: 'short' }
                  )}
                </p>
              </div>
            </div>

            <span
              className={`text-xs font-bold px-3 py-1 rounded-full border ${
                order.returnRequest.status === 'Approved & Refunded' ||
                order.returnRequest.status === 'Replacement Sent'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : order.returnRequest.status === 'Rejected'
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              Status: {order.returnRequest.status}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600">
            <div>
              <span className="text-slate-400 block">Request Type:</span>
              <span className="font-bold text-slate-900">
                {order.returnRequest.type} ({formatPrice(order.totalPrice)})
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Reason:</span>
              <span className="font-semibold text-slate-800">
                {order.returnRequest.reason}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">
                {order.returnRequest.type === 'Refund'
                  ? 'Refund Mode:'
                  : 'Resolution Mode:'}
              </span>
              <span className="font-semibold text-slate-800">
                {order.returnRequest.refundMethod}
                {order.returnRequest.refundUpiId
                  ? ` (${order.returnRequest.refundUpiId})`
                  : ''}
              </span>
            </div>
          </div>

          {order.returnRequest.comments && (
            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <strong>Customer Note:</strong> {order.returnRequest.comments}
            </p>
          )}
        </div>
      )}

      {showReturnForm && canRequestReturn && (
        <form
          onSubmit={handleReturnSubmit}
          className="bg-white rounded-2xl border-2 border-indigo-200 p-5 sm:p-6 space-y-4 shadow-sm"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-indigo-600" />
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  7-Day Easy Return / Refund Request
                </h2>
                <p className="text-xs text-slate-500">
                  Eligible for return ({daysRemainingForReturn} days remaining in
                  7-day window)
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowReturnForm(false)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Close &times;
            </button>
          </div>

          {returnError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{returnError}</span>
            </div>
          )}

          {/* Choose Refund vs Replacement */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label
              className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                returnType === 'Refund'
                  ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-500'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <input
                type="radio"
                name="returnType"
                checked={returnType === 'Refund'}
                onChange={() => setReturnType('Refund')}
                className="mt-1"
              />
              <div>
                <p className="font-bold text-sm text-slate-900">
                  Full Refund ({formatPrice(order.totalPrice)})
                </p>
                <p className="text-xs text-slate-500">
                  Get 100% refund to PhonePe / GPay UPI or original payment mode
                </p>
              </div>
            </label>

            <label
              className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                returnType === 'Replacement'
                  ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-500'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <input
                type="radio"
                name="returnType"
                checked={returnType === 'Replacement'}
                onChange={() => setReturnType('Replacement')}
                className="mt-1"
              />
              <div>
                <p className="font-bold text-sm text-slate-900">
                  Free Item Replacement
                </p>
                <p className="text-xs text-slate-500">
                  Exchange for a brand-new unit at your doorstep for free
                </p>
              </div>
            </label>
          </div>

          {/* Reason Dropdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Reason for Return / {returnType} *
              </label>
              <select
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white focus:outline-none focus:border-indigo-600"
              >
                {RETURN_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {returnType === 'Refund' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Preferred Refund Mode *
                </label>
                <select
                  value={refundMethod}
                  onChange={(e) => setRefundMethod(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white focus:outline-none focus:border-indigo-600"
                >
                  <option value="Instant UPI Refund (PhonePe / GPay)">
                    Instant UPI Refund (PhonePe / GPay)
                  </option>
                  <option value="Original Payment Method / Bank Account">
                    Original Payment Method / Bank Account
                  </option>
                </select>
              </div>
            )}
          </div>

          {returnType === 'Refund' && refundMethod.includes('UPI') && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Enter PhonePe / GPay UPI ID or Mobile Number for Refund *
              </label>
              <input
                type="text"
                required
                value={refundUpiId}
                onChange={(e) => setRefundUpiId(e.target.value)}
                placeholder="e.g. 9876543210@ybl or yourname@okaxis"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-indigo-600"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Additional Comments (Optional)
            </label>
            <textarea
              rows={2}
              value={returnComments}
              onChange={(e) => setReturnComments(e.target.value)}
              placeholder="Describe any issue with the item or pickup instructions..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => setShowReturnForm(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingReturn}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-colors cursor-pointer"
            >
              {submittingReturn
                ? 'Submitting Request...'
                : `Submit ${returnType} Request`}
            </button>
          </div>
        </form>
      )}

      {/* Live Order Status Tracker */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        {order.orderStatus === 'Cancelled' ? (
          <div className="flex items-center gap-3 text-red-700 bg-red-50 p-4 rounded-xl border border-red-200">
            <XCircle className="w-6 h-6 shrink-0" />
            <div>
              <p className="font-bold text-sm">This Order Was Cancelled</p>
              <p className="text-xs text-red-600">
                {order.cancelReason || 'Stock has been restored.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {STEPS.map((step, index) => {
              const completed = index <= currentStepIndex;
              return (
                <div key={step} className="text-center space-y-2">
                  <div
                    className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-xs font-bold ${
                      completed
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {completed ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <p
                    className={`text-xs font-semibold ${
                      completed ? 'text-indigo-700' : 'text-slate-400'
                    }`}
                  >
                    {step}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ordered Items List */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Package className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900">
              Ordered Items ({order.orderItems.length})
            </h2>
          </div>

          <div className="divide-y divide-slate-100">
            {order.orderItems.map((item, idx) => {
              const variantText = [item.variant?.size, item.variant?.color]
                .filter(Boolean)
                .join(' • ');
              return (
                <div
                  key={idx}
                  className="py-3.5 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5">
                    <img
                      src={
                        item.image &&
                        !item.image.includes('1584990347449-a2d4c2c044c9')
                          ? item.image
                          : 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=400&auto=format&fit=crop&q=80'
                      }
                      alt={item.name}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src =
                          'https://images.unsplash.com/photo-1585515320310-259814833e62?w=400&auto=format&fit=crop&q=80';
                      }}
                      className="w-16 h-16 rounded-xl object-cover bg-slate-100 border border-slate-200"
                    />
                    <div>
                      <Link
                        to={`/products/${item.product}`}
                        className="font-semibold text-sm text-slate-900 hover:text-indigo-600"
                      >
                        {item.name}
                      </Link>
                      {variantText && (
                        <p className="text-xs text-slate-500">
                          Variant: {variantText}
                        </p>
                      )}
                      <p className="text-xs text-slate-500">
                        {formatPrice(item.price)} &times; {item.qty}
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-sm text-slate-900">
                    {formatPrice(item.price * item.qty)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Shipping, Payment & Price Breakdown */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 text-sm">
            <div className="flex items-center gap-2 font-bold text-slate-900 border-b border-slate-100 pb-2">
              <MapPin className="w-4 h-4 text-indigo-600" />
              <span>Delivery Address</span>
            </div>
            <div className="text-xs text-slate-600 space-y-1">
              <p className="font-bold text-slate-900 text-sm">
                {order.shippingAddress.fullName}
              </p>
              <p>{order.shippingAddress.street}</p>
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state} -{' '}
                {order.shippingAddress.postalCode}
              </p>
              <p>Phone: {order.shippingAddress.phone}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 text-sm">
            <div className="flex items-center gap-2 font-bold text-slate-900 border-b border-slate-100 pb-2">
              <CreditCard className="w-4 h-4 text-indigo-600" />
              <span>Payment &amp; Bill Summary</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Method:</span>
              <span className="font-bold text-slate-900">
                {order.paymentResult?.channel || order.paymentMethod}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Payment Status:</span>
              <span
                className={`font-bold px-2 py-0.5 rounded-full ${
                  order.isPaid
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-amber-50 text-amber-700'
                }`}
              >
                {order.isPaid ? 'Paid' : 'Pending / COD'}
              </span>
            </div>

            <div className="border-t border-slate-100 pt-3 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Items Subtotal</span>
                <span>{formatPrice(order.itemsPrice)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount ({order.couponCode})</span>
                  <span>-{formatPrice(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Shipping</span>
                <span>
                  {order.shippingPrice === 0
                    ? 'FREE'
                    : formatPrice(order.shippingPrice)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>GST (5%)</span>
                <span>{formatPrice(order.taxPrice)}</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-extrabold text-slate-900">
                <span>Total</span>
                <span>{formatPrice(order.totalPrice)}</span>
              </div>
            </div>

            {!order.isPaid && order.orderStatus !== 'Cancelled' && (
              <button
                type="button"
                disabled={paying}
                onClick={handlePayOnline}
                className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-bold py-2.5 rounded-xl transition-colors cursor-pointer"
              >
                {paying
                  ? 'Processing Payment...'
                  : `Pay Online Now (${formatPrice(order.totalPrice)})`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
