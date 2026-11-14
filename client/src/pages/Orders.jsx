import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { formatPrice } from '../utils/formatPrice';
import { downloadOrderReceipt } from '../utils/downloadReceipt';
import { Package, ChevronRight, ShoppingBag, Download } from 'lucide-react';

const statusBadgeStyles = {
  Placed: 'bg-blue-50 text-blue-700 border-blue-200',
  Packed: 'bg-amber-50 text-amber-700 border-amber-200',
  Shipped: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  Delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Cancelled: 'bg-red-50 text-red-700 border-red-200',
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyOrders = async () => {
      try {
        const { data } = await api.get('/orders/my');
        setOrders(data.orders || []);
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMyOrders();
  }, []);

  if (loading) {
    return (
      <div className="py-24 flex justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="py-20 text-center space-y-5 max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">No Orders Yet</h1>
        <p className="text-sm text-slate-500">
          You haven&apos;t placed any orders yet. Once you place an order, you can track its live status right here!
        </p>
        <Link
          to="/products"
          className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-full transition-colors"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="py-8 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Orders</h1>
        <p className="text-sm text-slate-500">
          Track, manage, or view details of your past orders
        </p>
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <div
            key={order._id}
            className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-indigo-300 transition-all space-y-4"
          >
            {/* Header Row */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">
                    Order #{order._id.slice(-8).toUpperCase()}
                  </p>
                  <p className="text-xs font-medium text-slate-600">
                    Placed on{' '}
                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                {order.returnRequest?.isRequested && (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full border bg-amber-50 text-amber-800 border-amber-200">
                    {order.returnRequest.type}: {order.returnRequest.status}
                  </span>
                )}
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full border ${
                    statusBadgeStyles[order.orderStatus] ||
                    statusBadgeStyles.Placed
                  }`}
                >
                  {order.orderStatus}
                </span>
                <span className="text-base font-extrabold text-slate-900">
                  {formatPrice(order.totalPrice)}
                </span>
              </div>
            </div>

            {/* Order Items Preview & View Details Link */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3 overflow-x-auto">
                {order.orderItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2.5 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-10 h-10 rounded-lg object-cover bg-white shrink-0"
                    />
                    <div className="text-xs">
                      <p className="font-semibold text-slate-800 max-w-[160px] truncate">
                        {item.name}
                      </p>
                      <p className="text-slate-500">Qty: {item.qty}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3 ml-auto sm:ml-0">
                <button
                  type="button"
                  onClick={() => downloadOrderReceipt(order)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Receipt (PDF)</span>
                </button>

                <Link
                  to={`/orders/${order._id}`}
                  className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-indigo-600 hover:underline"
                >
                  <span>Track / Details</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Orders;
