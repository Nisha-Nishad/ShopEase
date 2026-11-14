import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  updateItemQuantity,
  removeItemFromCart,
  clearEntireCart,
} from '../redux/slices/cartSlice';
import { formatPrice } from '../utils/formatPrice';
import {
  ShoppingBag,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Truck,
} from 'lucide-react';

const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, totalPrice } = useSelector((state) => state.cart);
  const { isAuthenticated } = useSelector((state) => state.auth);

  // Price calculations (Free shipping above ₹499, 18% GST included/estimated)
  const itemsPrice = totalPrice;
  const shippingPrice = itemsPrice === 0 || itemsPrice >= 499 ? 0 : 49;
  const grandTotal = itemsPrice + shippingPrice;

  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: '/checkout' } } });
    } else {
      navigate('/checkout');
    }
  };

  if (items.length === 0) {
    return (
      <div className="py-20 text-center space-y-5 max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">
          Your Shopping Cart is Empty
        </h1>
        <p className="text-sm text-slate-500">
          Looks like you haven&apos;t added anything to your cart yet. Explore our latest deals and top-rated items!
        </p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-full transition-colors"
        >
          <span>Start Shopping</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Shopping Cart</h1>
          <p className="text-sm text-slate-500">
            {items.length} {items.length === 1 ? 'item' : 'items'} in your cart
          </p>
        </div>

        <button
          type="button"
          onClick={() => dispatch(clearEntireCart())}
          className="text-xs font-semibold text-red-600 hover:underline flex items-center gap-1 cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Cart</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left: Cart Items List */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const product = item.product || {};
            const unitPrice =
              product.discountPrice && product.discountPrice > 0
                ? product.discountPrice
                : product.price || 0;
            const variantLabel = [item.variant?.size, item.variant?.color]
              .filter(Boolean)
              .join(' • ');

            return (
              <div
                key={item._id}
                className="bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 sm:gap-4"
              >
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  <Link
                    to={`/products/${product.slug || product._id}`}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200"
                  >
                    <img
                      src={
                        product.images?.[0] &&
                        !product.images[0].includes('1584990347449-a2d4c2c044c9')
                          ? product.images[0]
                          : 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=400&auto=format&fit=crop&q=80'
                      }
                      alt={product.name}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src =
                          'https://images.unsplash.com/photo-1585515320310-259814833e62?w=400&auto=format&fit=crop&q=80';
                      }}
                      className="w-full h-full object-cover"
                    />
                  </Link>

                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-indigo-600">
                      {product.brand}
                    </p>
                    <Link
                      to={`/products/${product.slug || product._id}`}
                      className="font-semibold text-sm sm:text-base text-slate-900 hover:text-indigo-600 line-clamp-2 sm:line-clamp-1"
                    >
                      {product.name}
                    </Link>
                    {variantLabel && (
                      <p className="text-xs text-slate-500">
                        Variant:{' '}
                        <span className="font-medium text-slate-700">
                          {variantLabel}
                        </span>
                      </p>
                    )}
                    <p className="text-xs sm:text-sm font-bold text-slate-900 pt-0.5">
                      {formatPrice(unitPrice)}{' '}
                      <span className="text-xs font-normal text-slate-400">
                        each
                      </span>
                    </p>
                  </div>
                </div>

                {/* Quantity Controls & Subtotal */}
                <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() =>
                        dispatch(
                          updateItemQuantity({
                            itemId: item._id,
                            quantity: item.quantity - 1,
                          })
                        )
                      }
                      className="px-3 py-1.5 text-slate-700 hover:bg-slate-100 font-bold cursor-pointer"
                    >
                      -
                    </button>
                    <span className="px-3 py-1.5 text-xs font-semibold text-slate-900">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        dispatch(
                          updateItemQuantity({
                            itemId: item._id,
                            quantity: item.quantity + 1,
                          })
                        )
                      }
                      className="px-3 py-1.5 text-slate-700 hover:bg-slate-100 font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  <div className="text-right min-w-[85px]">
                    <p className="text-sm font-bold text-slate-900">
                      {formatPrice(unitPrice * item.quantity)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => dispatch(removeItemFromCart(item._id))}
                    title="Remove item"
                    className="p-2 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Order Summary Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 sticky top-24">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
            Order Summary
          </h2>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Items Subtotal</span>
              <span className="font-semibold text-slate-900">
                {formatPrice(itemsPrice)}
              </span>
            </div>

            <div className="flex justify-between text-slate-600">
              <span>Delivery Charges</span>
              {shippingPrice === 0 ? (
                <span className="font-semibold text-emerald-600">FREE</span>
              ) : (
                <span className="font-semibold text-slate-900">
                  {formatPrice(shippingPrice)}
                </span>
              )}
            </div>

            <div className="border-t border-slate-200 pt-3 flex justify-between text-base font-bold text-slate-900">
              <span>Total Amount</span>
              <span>{formatPrice(grandTotal)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCheckout}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Free delivery unlocked on orders over ₹499</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>100% secure payments via Razorpay &amp; COD</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
