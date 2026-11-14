import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { formatPrice } from '../../utils/formatPrice';
import { ExternalLink } from 'lucide-react';

const STATUS_OPTIONS = [
  'Placed',
  'Packed',
  'Shipped',
  'Delivered',
  'Cancelled',
];

const RETURN_STATUS_OPTIONS = [
  'Requested',
  'Approved & Refunded',
  'Replacement Sent',
  'Rejected',
];

const ManageOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const loadOrders = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/orders');
      setOrders(data.orders || []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const { data } = await api.put(`/orders/${orderId}/status`, {
        orderStatus: newStatus,
      });
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? data.order : o))
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Could not update order status');
    }
  };

  const handleReturnStatusChange = async (orderId, newReturnStatus) => {
    try {
      const { data } = await api.put(`/orders/${orderId}/return-status`, {
        status: newReturnStatus,
      });
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? data.order : o))
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Could not update return status');
    }
  };

  const filteredOrders = statusFilter
    ? orders.filter((o) => o.orderStatus === statusFilter)
    : orders;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-bold text-slate-900">
          Customer Orders ({filteredOrders.length})
        </h2>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="p-10 text-center text-sm text-slate-500">
          Loading orders...
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="p-10 text-center text-sm text-slate-500">
          No orders found.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase">
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Update Status</th>
                <th className="py-3 px-4">7-Day Return / Refund</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.map((order) => (
                <tr key={order._id} className="hover:bg-slate-50/80">
                  <td className="py-3 px-4 font-mono text-xs font-bold text-slate-800">
                    #{order._id.slice(-8).toUpperCase()}
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-semibold text-slate-900">
                      {order.user?.name || order.shippingAddress?.fullName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {order.user?.email || order.shippingAddress?.phone}
                    </p>
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-600">
                    {new Date(order.createdAt).toLocaleDateString('en-IN')}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {formatPrice(order.totalPrice)}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        order.isPaid
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {order.paymentMethod} • {order.isPaid ? 'Paid' : 'Pending'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={order.orderStatus}
                      onChange={(e) =>
                        handleStatusChange(order._id, e.target.value)
                      }
                      className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold bg-white"
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    {order.returnRequest?.isRequested ? (
                      <div className="space-y-1">
                        <p className="text-[11px] font-bold text-amber-800">
                          {order.returnRequest.type}: {order.returnRequest.reason}
                        </p>
                        {order.returnRequest.refundUpiId && (
                          <p className="text-[10px] font-mono text-slate-600">
                            UPI: {order.returnRequest.refundUpiId}
                          </p>
                        )}
                        <select
                          value={order.returnRequest.status}
                          onChange={(e) =>
                            handleReturnStatusChange(order._id, e.target.value)
                          }
                          className="px-2 py-1 rounded-lg border border-amber-300 text-xs font-semibold bg-amber-50 text-amber-900"
                        >
                          {RETURN_STATUS_OPTIONS.map((rs) => (
                            <option key={rs} value={rs}>
                              {rs}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">None</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      to={`/orders/${order._id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline"
                    >
                      <span>View</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ManageOrders;
