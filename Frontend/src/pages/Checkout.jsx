import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { syncAndMergeCart } from '../redux/slices/cartSlice';
import { updateUserProfile } from '../redux/slices/authSlice';
import api from '../services/api';
import { formatPrice } from '../utils/formatPrice';
import { initiateRazorpayPayment } from '../utils/razorpayCheckout';
import { generateQrMatrix, buildUpiPaymentUri } from '../utils/upiQrCode';
import {
  MapPin,
  CreditCard,
  Tag,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ArrowLeft,
  QrCode,
  Smartphone,
} from 'lucide-react';

const Checkout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { items, totalPrice } = useSelector((state) => state.cart);

  // Shipping Address State (Pre-fill with user's default saved address if available)
  const [shippingAddress, setShippingAddress] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
  });
  const [saveAddressToProfile, setSaveAddressToProfile] = useState(false);

  useEffect(() => {
    if (user?.addresses?.length > 0) {
      const def =
        user.addresses.find((a) => a.isDefault) || user.addresses[0];
      setShippingAddress({
        fullName: def.fullName || user.name || '',
        phone: def.phone || user.phone || '',
        street: def.street || '',
        city: def.city || '',
        state: def.state || '',
        postalCode: def.postalCode || '',
        country: def.country || 'India',
      });
    }
  }, [user]);

  // Payment Method State
  const [paymentMethod, setPaymentMethod] = useState('COD');
  // Sub-options when Online Payment ('Razorpay') is selected: 'phonepe' | 'gpay' | 'card'
  const [onlineChannel, setOnlineChannel] = useState('phonepe');
  // Sub-mode for PhonePe / GPay: 'qr' (Scan & Pay) | 'id' (UPI Number / ID)
  const [upiMode, setUpiMode] = useState('qr');
  const [upiIdInput, setUpiIdInput] = useState('');
  const [receiverUpiId, setReceiverUpiId] = useState(
    () => localStorage.getItem('shopease_merchant_upi') || '9876543210@ybl'
  );

  // Coupon State
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  // Order Submission State
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState('');

  // Price Breakdown Calculations
  const itemsPrice = totalPrice;
  const discount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const shippingPrice = itemsPrice >= 499 ? 0 : 49;
  const taxableAmount = Math.max(0, itemsPrice - discount);
  const taxPrice = Math.round(taxableAmount * 0.05); // 5% GST
  const grandTotal = Math.max(0, taxableAmount + shippingPrice + taxPrice);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      const { data } = await api.post('/coupons/apply', {
        code: couponInput.trim(),
        itemsPrice,
      });
      setAppliedCoupon(data.coupon);
    } catch (err) {
      setAppliedCoupon(null);
      setCouponError(err.response?.data?.message || 'Invalid coupon code');
    } finally {
      setCouponLoading(false);
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (items.length === 0) return;

    setPlacingOrder(true);
    setOrderError('');

    try {
      // Save new address to user profile if checkbox is checked
      if (saveAddressToProfile && user) {
        const updatedAddresses = [...(user.addresses || []), shippingAddress];
        dispatch(
          updateUserProfile({
            name: user.name,
            phone: user.phone,
            addresses: updatedAddresses,
          })
        );
      }

      const payload = {
        orderItems: items.map((item) => ({
          product: item.product._id,
          qty: item.quantity,
          variant: item.variant,
        })),
        shippingAddress,
        paymentMethod,
        couponCode: appliedCoupon ? appliedCoupon.code : '',
      };

      const { data } = await api.post('/orders', payload);
      const createdOrder = data.order;

      // Refresh Redux cart state (backend already cleared MongoDB cart)
      dispatch(syncAndMergeCart());

      // If user chose Online Payment (Razorpay), initiate payment & verify signature
      if (paymentMethod === 'Razorpay') {
        await initiateRazorpayPayment({
          order: createdOrder,
          user,
          preferredMethod: onlineChannel,
          preferredUpiMode: upiMode,
          initialUpiId: upiIdInput,
          initialReceiverUpi: receiverUpiId,
          onSuccess: () => {
            navigate(`/orders/${createdOrder._id}`);
          },
          onError: () => {
            // Even if payment modal is dismissed, order is saved so redirect to Order Detail where they can retry payment
            navigate(`/orders/${createdOrder._id}`);
          },
        });
      } else {
        // Cash on Delivery (COD) -> Redirect directly to Order Detail & Tracking page
        navigate(`/orders/${createdOrder._id}`);
      }
    } catch (err) {
      setOrderError(
        err.response?.data?.message || 'Could not place order. Please try again.'
      );
    } finally {
      setPlacingOrder(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Your cart is empty</h2>
        <p className="text-sm text-slate-500">
          Add products to your cart before proceeding to checkout.
        </p>
        <Link
          to="/products"
          className="inline-block bg-indigo-600 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-indigo-700"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  const normalizedReceiverVpa = (() => {
    const raw = (receiverUpiId || '').trim().toLowerCase();
    if (!raw) return '9876543210@ybl';
    const digits = raw.replace(/\D/g, '');
    if (digits.length === 10 && !raw.includes('@')) {
      return `${digits}${onlineChannel === 'gpay' ? '@okaxis' : '@ybl'}`;
    }
    if (raw.includes('@')) return raw;
    return `${raw}${onlineChannel === 'gpay' ? '@okaxis' : '@ybl'}`;
  })();

  const liveUpiUri = buildUpiPaymentUri({
    pa: normalizedReceiverVpa,
    pn: 'ShopEase Store',
    am: grandTotal,
    tn: 'ShopEase Order Payment',
  });

  const liveQrMatrix = (() => {
    try {
      return generateQrMatrix(liveUpiUri);
    } catch {
      return null;
    }
  })();

  return (
    <div className="py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Secure Checkout</h1>
          <p className="text-sm text-slate-500">
            Complete your shipping address and payment details below
          </p>
        </div>
        <Link
          to="/cart"
          className="text-sm font-medium text-slate-600 hover:text-indigo-600 flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Cart</span>
        </Link>
      </div>

      {orderError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{orderError}</span>
        </div>
      )}

      <form
        onSubmit={handlePlaceOrder}
        className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start"
      >
        {/* Left 2 Columns: Shipping Address & Payment Method */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Saved Addresses Quick Selector */}
          {user?.addresses?.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                Select a Saved Address
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {user.addresses.map((addr, idx) => (
                  <button
                    key={addr._id || idx}
                    type="button"
                    onClick={() =>
                      setShippingAddress({
                        fullName: addr.fullName,
                        phone: addr.phone,
                        street: addr.street,
                        city: addr.city,
                        state: addr.state,
                        postalCode: addr.postalCode,
                        country: addr.country || 'India',
                      })
                    }
                    className={`p-3.5 rounded-xl border text-left text-xs space-y-1 transition-all cursor-pointer ${
                      shippingAddress.street === addr.street &&
                      shippingAddress.postalCode === addr.postalCode
                        ? 'border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-500'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <p className="font-bold text-slate-900 text-sm">
                      {addr.fullName}
                    </p>
                    <p className="text-slate-600">{addr.street}</p>
                    <p className="text-slate-600">
                      {addr.city}, {addr.state} - {addr.postalCode}
                    </p>
                    <p className="text-slate-500">Phone: {addr.phone}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 2. Shipping Address Form */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <MapPin className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-900">
                Shipping Address
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Recipient Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={shippingAddress.fullName}
                  onChange={(e) =>
                    setShippingAddress({
                      ...shippingAddress,
                      fullName: e.target.value,
                    })
                  }
                  placeholder="Nisha Nishad"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  value={shippingAddress.phone}
                  onChange={(e) =>
                    setShippingAddress({
                      ...shippingAddress,
                      phone: e.target.value,
                    })
                  }
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Street Address / Flat / Landmark *
                </label>
                <input
                  type="text"
                  required
                  value={shippingAddress.street}
                  onChange={(e) =>
                    setShippingAddress({
                      ...shippingAddress,
                      street: e.target.value,
                    })
                  }
                  placeholder="House No, Building, Street, Area"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  required
                  value={shippingAddress.city}
                  onChange={(e) =>
                    setShippingAddress({
                      ...shippingAddress,
                      city: e.target.value,
                    })
                  }
                  placeholder="Bengaluru"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    required
                    value={shippingAddress.state}
                    onChange={(e) =>
                      setShippingAddress({
                        ...shippingAddress,
                        state: e.target.value,
                      })
                    }
                    placeholder="Karnataka"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    PIN Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={shippingAddress.postalCode}
                    onChange={(e) =>
                      setShippingAddress({
                        ...shippingAddress,
                        postalCode: e.target.value,
                      })
                    }
                    placeholder="560038"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>
            </div>

            <label className="inline-flex items-center gap-2 text-xs text-slate-600 pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={saveAddressToProfile}
                onChange={(e) => setSaveAddressToProfile(e.target.checked)}
                className="rounded text-indigo-600"
              />
              <span>Save this address to my account profile for future orders</span>
            </label>
          </div>

          {/* 3. Payment Method Selection */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <CreditCard className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-900">
                Payment Method
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label
                className={`p-4 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                  paymentMethod === 'COD'
                    ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-500'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="COD"
                  checked={paymentMethod === 'COD'}
                  onChange={() => setPaymentMethod('COD')}
                  className="mt-1"
                />
                <div>
                  <p className="font-bold text-sm text-slate-900">
                    Cash on Delivery (COD)
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pay in cash or UPI when your order arrives at your doorstep
                  </p>
                </div>
              </label>

              <label
                className={`p-4 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                  paymentMethod === 'Razorpay'
                    ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-500'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="Razorpay"
                  checked={paymentMethod === 'Razorpay'}
                  onChange={() => setPaymentMethod('Razorpay')}
                  className="mt-1"
                />
                <div>
                  <p className="font-bold text-sm text-slate-900">
                    Online Payment (PhonePe / GPay / Debit Card)
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Instant payment via PhonePe, Google Pay, UPI QR, or Debit/Credit Card
                  </p>
                </div>
              </label>
            </div>

            {/* Expanded Online Payment Options: PhonePe | GPay | Debit Card */}
            {paymentMethod === 'Razorpay' && (
              <div className="mt-4 pt-4 border-t border-slate-200 space-y-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Choose Online Payment Option
                </p>

                {/* 3 Option Cards: PhonePe, GPay, Debit Card */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setOnlineChannel('phonepe')}
                    className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                      onlineChannel === 'phonepe'
                        ? 'border-[#5f259f] bg-[#5f259f]/5 ring-2 ring-[#5f259f]/30'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <span className="w-9 h-9 rounded-xl bg-[#5f259f] text-white font-black text-sm flex items-center justify-center shrink-0">
                      Pe
                    </span>
                    <div>
                      <p className="font-bold text-sm text-slate-900">
                        PhonePe
                      </p>
                      <p className="text-[11px] text-slate-500">
                        UPI Number or Scan QR
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOnlineChannel('gpay')}
                    className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                      onlineChannel === 'gpay'
                        ? 'border-[#1a73e8] bg-[#1a73e8]/5 ring-2 ring-[#1a73e8]/30'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <span className="w-9 h-9 rounded-xl bg-[#1a73e8] text-white font-black text-sm flex items-center justify-center shrink-0">
                      G
                    </span>
                    <div>
                      <p className="font-bold text-sm text-slate-900">
                        Google Pay
                      </p>
                      <p className="text-[11px] text-slate-500">
                        GPay UPI or Scan QR
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOnlineChannel('card')}
                    className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                      onlineChannel === 'card'
                        ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/30'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <span className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                      <CreditCard className="w-4 h-4" />
                    </span>
                    <div>
                      <p className="font-bold text-sm text-slate-900">
                        Debit Card
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Visa / MasterCard / RuPay
                      </p>
                    </div>
                  </button>
                </div>

                {/* PhonePe / GPay Sub-Options: UPI Number vs Scan & Pay QR */}
                {(onlineChannel === 'phonepe' || onlineChannel === 'gpay') && (
                  <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-800">
                        Pay with{' '}
                        {onlineChannel === 'phonepe'
                          ? 'PhonePe'
                          : 'Google Pay (GPay)'}
                      </span>

                      <div className="inline-flex p-1 rounded-xl bg-white border border-slate-200">
                        <button
                          type="button"
                          onClick={() => setUpiMode('qr')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                            upiMode === 'qr'
                              ? onlineChannel === 'phonepe'
                                ? 'bg-[#5f259f] text-white'
                                : 'bg-[#1a73e8] text-white'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>Scan &amp; Pay (QR)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setUpiMode('id')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                            upiMode === 'id'
                              ? onlineChannel === 'phonepe'
                                ? 'bg-[#5f259f] text-white'
                                : 'bg-[#1a73e8] text-white'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <Smartphone className="w-3.5 h-3.5" />
                          <span>UPI Number / ID</span>
                        </button>
                      </div>
                    </div>

                    {upiMode === 'qr' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center bg-white rounded-xl border border-slate-200 p-4">
                        <div className="text-center space-y-2">
                          {liveQrMatrix && (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox={`0 0 ${liveQrMatrix.length + 6} ${
                                liveQrMatrix.length + 6
                              }`}
                              className="w-44 h-44 mx-auto rounded-xl border border-slate-200 p-1.5 bg-white shadow-xs"
                              shapeRendering="crispEdges"
                            >
                              <rect
                                width={liveQrMatrix.length + 6}
                                height={liveQrMatrix.length + 6}
                                fill="#ffffff"
                              />
                              <path
                                d={liveQrMatrix
                                  .map((row, r) =>
                                    row
                                      .map((cell, c) =>
                                        cell ? `M${c + 3},${r + 3}h1v1h-1z` : ''
                                      )
                                      .join('')
                                  )
                                  .join('')}
                                fill="#0f172a"
                              />
                            </svg>
                          )}
                          <span className="inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Scan to Pay {formatPrice(grandTotal)}
                          </span>
                        </div>

                        <div className="space-y-2.5 text-xs">
                          <p className="font-bold text-slate-900 text-sm">
                            Scan with{' '}
                            {onlineChannel === 'phonepe'
                              ? 'PhonePe'
                              : 'Google Pay'}{' '}
                            App
                          </p>
                          <p className="text-slate-600 leading-relaxed">
                            1. Open{' '}
                            <strong>
                              {onlineChannel === 'phonepe'
                                ? 'PhonePe'
                                : 'Google Pay'}
                            </strong>{' '}
                            on your phone and tap <strong>Scan &amp; Pay</strong>.
                            <br />
                            2. Scan this QR code — you will immediately see a pay
                            request for <strong>{formatPrice(grandTotal)}</strong>.
                            <br />
                            3. Click <strong>Place Order</strong> to confirm and
                            complete verification.
                          </p>

                          <div className="pt-1 space-y-1">
                            <label className="block text-[11px] font-bold text-slate-700">
                              Merchant / Receiver UPI ID (for Live Scan):
                            </label>
                            <input
                              type="text"
                              value={receiverUpiId}
                              onChange={(e) => {
                                setReceiverUpiId(e.target.value);
                                localStorage.setItem(
                                  'shopease_merchant_upi',
                                  e.target.value.trim()
                                );
                              }}
                              placeholder="Enter valid UPI ID (e.g. 9876543210@ybl)"
                              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono focus:outline-none focus:border-indigo-600"
                            />
                            <p className="text-[10px] text-slate-500">
                              Enter any active UPI ID / PhonePe number here so
                              scanning the QR opens a real payment screen on your
                              phone.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                        <label className="block text-xs font-bold text-slate-700">
                          Enter Your{' '}
                          {onlineChannel === 'phonepe'
                            ? 'PhonePe Mobile Number or UPI ID'
                            : 'Google Pay Mobile Number or UPI ID'}
                        </label>
                        <input
                          type="text"
                          value={upiIdInput}
                          onChange={(e) => {
                            setUpiIdInput(e.target.value);
                            if (e.target.value.trim().length >= 10) {
                              setReceiverUpiId(e.target.value.trim());
                            }
                          }}
                          placeholder={
                            onlineChannel === 'phonepe'
                              ? 'e.g. 9876543210 or 9876543210@ybl'
                              : 'e.g. 9876543210 or yourname@okaxis'
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-indigo-600"
                        />
                        <div className="flex flex-wrap gap-1.5">
                          {(onlineChannel === 'phonepe'
                            ? ['@ybl', '@ibl', '@axl']
                            : ['@okaxis', '@oksbi', '@okicici', '@okhdfcbank']
                          ).map((suffix) => (
                            <button
                              key={suffix}
                              type="button"
                              onClick={() => {
                                const base =
                                  upiIdInput.split('@')[0].trim() ||
                                  shippingAddress.phone
                                    .replace(/\D/g, '')
                                    .slice(-10) ||
                                  '9876543210';
                                const full = `${base}${suffix}`;
                                setUpiIdInput(full);
                                setReceiverUpiId(full);
                              }}
                              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:border-indigo-400 text-[11px] font-mono font-semibold text-slate-700 cursor-pointer"
                            >
                              {suffix}
                            </button>
                          ))}
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Click <strong>Place Order</strong> below to send a{' '}
                          <strong>{formatPrice(grandTotal)}</strong> payment
                          request to your{' '}
                          {onlineChannel === 'phonepe'
                            ? 'PhonePe'
                            : 'Google Pay'}{' '}
                          app.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {onlineChannel === 'card' && (
                  <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 text-xs text-slate-600 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-slate-900 text-sm">
                        Debit / Credit Card Payment
                      </p>
                      <p className="mt-0.5">
                        Click <strong>Place Order</strong> to enter your 16-digit
                        Card Number, Expiry, CVV, and 3D Secure Bank OTP in the
                        encrypted payment gateway window.
                      </p>
                    </div>
                    <CreditCard className="w-8 h-8 text-indigo-600 shrink-0" />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Coupon & Order Summary */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 sticky top-24">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
            Order Summary ({items.length} items)
          </h2>

          {/* Mini Item List */}
          <div className="max-h-56 overflow-y-auto space-y-3 pr-1">
            {items.map((item) => {
              const p = item.product || {};
              const price =
                p.discountPrice && p.discountPrice > 0
                  ? p.discountPrice
                  : p.price || 0;
              return (
                <div
                  key={item._id}
                  className="flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={
                        p.images?.[0] &&
                        !p.images[0].includes('1584990347449-a2d4c2c044c9')
                          ? p.images[0]
                          : 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=400&auto=format&fit=crop&q=80'
                      }
                      alt={p.name}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src =
                          'https://images.unsplash.com/photo-1585515320310-259814833e62?w=400&auto=format&fit=crop&q=80';
                      }}
                      className="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 truncate">
                        {p.name}
                      </p>
                      <p className="text-slate-400">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <span className="font-bold text-slate-900 shrink-0">
                    {formatPrice(price * item.quantity)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Coupon Box */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-indigo-600" />
              <span>Have a Promo Code?</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                placeholder="Try WELCOME10 or FLAT500"
                className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs uppercase font-semibold focus:outline-none focus:border-indigo-600"
              />
              <button
                type="button"
                disabled={couponLoading}
                onClick={handleApplyCoupon}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors cursor-pointer"
              >
                {couponLoading ? '...' : 'Apply'}
              </button>
            </div>
            {couponError && (
              <p className="text-xs text-red-600 font-medium">{couponError}</p>
            )}
            {appliedCoupon && (
              <div className="flex items-center justify-between text-xs bg-emerald-50 text-emerald-700 px-3 py-2 rounded-lg border border-emerald-200">
                <span className="font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Code {appliedCoupon.code} applied!
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setAppliedCoupon(null);
                    setCouponInput('');
                  }}
                  className="underline font-semibold cursor-pointer"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          {/* Price Breakdown */}
          <div className="space-y-2.5 text-sm border-t border-slate-100 pt-4">
            <div className="flex justify-between text-slate-600">
              <span>Items Subtotal</span>
              <span className="font-semibold text-slate-900">
                {formatPrice(itemsPrice)}
              </span>
            </div>

            {discount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Coupon Discount ({appliedCoupon.code})</span>
                <span className="font-semibold">-{formatPrice(discount)}</span>
              </div>
            )}

            <div className="flex justify-between text-slate-600">
              <span>Shipping Charges</span>
              {shippingPrice === 0 ? (
                <span className="font-semibold text-emerald-600">FREE</span>
              ) : (
                <span className="font-semibold text-slate-900">
                  {formatPrice(shippingPrice)}
                </span>
              )}
            </div>

            <div className="flex justify-between text-slate-600">
              <span>Estimated GST (5%)</span>
              <span className="font-semibold text-slate-900">
                {formatPrice(taxPrice)}
              </span>
            </div>

            <div className="border-t border-slate-200 pt-3 flex justify-between text-base font-extrabold text-slate-900">
              <span>Grand Total</span>
              <span>{formatPrice(grandTotal)}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={placingOrder}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-3.5 rounded-xl transition-colors cursor-pointer"
          >
            {placingOrder
              ? 'Placing Your Order...'
              : `Place Order • ${formatPrice(grandTotal)}`}
          </button>

          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>Guaranteed safe &amp; encrypted checkout</span>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Checkout;
