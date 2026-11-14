import { useState, useEffect } from 'react';
import api from '../../services/api';
import { formatPrice } from '../../utils/formatPrice';
import { Users, Tag, Trash2, Ban, CheckCircle } from 'lucide-react';

const ManageUsersAndCoupons = () => {
  const [users, setUsers] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  const [couponForm, setCouponForm] = useState({
    code: '',
    discountType: 'percent',
    value: '',
    minOrderValue: '',
    maxDiscount: '',
    expiryDate: '2028-12-31',
    usageLimit: '100',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersRes, couponsRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/coupons'),
      ]);
      setUsers(usersRes.data.users || []);
      setCoupons(couponsRes.data.coupons || []);
    } catch {
      // ignore error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRoleChange = async (userId, role) => {
    try {
      const { data } = await api.put(`/admin/users/${userId}`, { role });
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? data.user : u))
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update role');
    }
  };

  const handleToggleBlock = async (user) => {
    try {
      const { data } = await api.put(`/admin/users/${user._id}`, {
        isBlocked: !user.isBlocked,
      });
      setUsers((prev) =>
        prev.map((u) => (u._id === user._id ? data.user : u))
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update block status');
    }
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    try {
      await api.post('/coupons', couponForm);
      setCouponForm({
        code: '',
        discountType: 'percent',
        value: '',
        minOrderValue: '',
        maxDiscount: '',
        expiryDate: '2028-12-31',
        usageLimit: '100',
      });
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not create coupon');
    }
  };

  const handleDeleteCoupon = async (id) => {
    if (!window.confirm('Delete this coupon?')) return;
    try {
      await api.delete(`/coupons/${id}`);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not delete coupon');
    }
  };

  if (loading) {
    return (
      <div className="p-10 text-center text-sm text-slate-500">
        Loading users and coupons...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 1. Coupon Management */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form
          onSubmit={handleCreateCoupon}
          className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4"
        >
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Tag className="w-5 h-5 text-indigo-600" />
            <span>Create Discount Coupon</span>
          </h2>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Coupon Code *
              </label>
              <input
                type="text"
                required
                value={couponForm.code}
                onChange={(e) =>
                  setCouponForm({
                    ...couponForm,
                    code: e.target.value.toUpperCase(),
                  })
                }
                placeholder="FESTIVE20"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs uppercase font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Type
                </label>
                <select
                  value={couponForm.discountType}
                  onChange={(e) =>
                    setCouponForm({
                      ...couponForm,
                      discountType: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                >
                  <option value="percent">Percent (%)</option>
                  <option value="flat">Flat (₹)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Discount Value *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={couponForm.value}
                  onChange={(e) =>
                    setCouponForm({ ...couponForm, value: e.target.value })
                  }
                  placeholder="20"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Min Order (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={couponForm.minOrderValue}
                  onChange={(e) =>
                    setCouponForm({
                      ...couponForm,
                      minOrderValue: e.target.value,
                    })
                  }
                  placeholder="999"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Expiry Date *
                </label>
                <input
                  type="date"
                  required
                  value={couponForm.expiryDate}
                  onChange={(e) =>
                    setCouponForm({
                      ...couponForm,
                      expiryDate: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2.5 rounded-xl transition-colors cursor-pointer"
            >
              Create Coupon
            </button>
          </div>
        </form>

        {/* Active Coupons Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-900">
              Active Coupons ({coupons.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase">
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Discount</th>
                  <th className="py-3 px-4">Min Order</th>
                  <th className="py-3 px-4">Usage</th>
                  <th className="py-3 px-4">Expiry</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {coupons.map((c) => (
                  <tr key={c._id}>
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                      {c.code}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {c.discountType === 'percent'
                        ? `${c.value}% OFF`
                        : `${formatPrice(c.value)} OFF`}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      {formatPrice(c.minOrderValue)}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      {c.usedCount} / {c.usageLimit}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      {new Date(c.expiryDate).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteCoupon(c._id)}
                        className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 2. Users Management Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-slate-900">
            Registered Users ({users.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase">
                <th className="py-3 px-4">Name &amp; Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Block / Unblock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-slate-50/80">
                  <td className="py-3 px-4">
                    <p className="font-semibold text-slate-900">{u.name}</p>
                    <p className="text-xs text-slate-500">{u.email}</p>
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u._id, e.target.value)}
                      className="px-2.5 py-1 rounded-lg border border-slate-300 text-xs font-semibold bg-white"
                    >
                      <option value="customer">Customer</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    {u.isBlocked ? (
                      <span className="text-xs font-bold bg-red-50 text-red-700 px-2.5 py-1 rounded-full">
                        Suspended
                      </span>
                    ) : (
                      <span className="text-xs font-bold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleToggleBlock(u)}
                      className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer ${
                        u.isBlocked
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-red-50 text-red-700 hover:bg-red-100'
                      }`}
                    >
                      {u.isBlocked ? (
                        <>
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Unblock</span>
                        </>
                      ) : (
                        <>
                          <Ban className="w-3.5 h-3.5" />
                          <span>Block</span>
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManageUsersAndCoupons;
