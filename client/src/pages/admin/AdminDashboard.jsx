import { useState, useEffect } from 'react';
import api from '../../services/api';
import { formatPrice } from '../../utils/formatPrice';
import ManageProducts from './ManageProducts';
import ManageOrders from './ManageOrders';
import ManageUsersAndCoupons from './ManageUsersAndCoupons';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Download,
  AlertTriangle,
  IndianRupee,
} from 'lucide-react';

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/admin/stats');
        setDashboardData(data);
      } catch {
        setDashboardData(null);
      } finally {
        setLoading(false);
      }
    };
    if (activeTab === 'overview') {
      fetchStats();
    }
  }, [activeTab]);

  const handleDownloadCSV = async () => {
    try {
      const response = await api.get('/admin/reports/sales', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'shopease_sales_report.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      alert('Failed to download sales report CSV');
    }
  };

  const stats = dashboardData?.stats || {
    totalRevenue: 0,
    paidRevenue: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalProducts: 0,
  };
  const lowStockProducts = dashboardData?.lowStockProducts || [];
  const monthlyRevenue = dashboardData?.monthlyRevenue || [];
  const maxMonthRev = Math.max(
    1,
    ...monthlyRevenue.map((m) => m.revenue || 0)
  );

  return (
    <div className="py-8 space-y-6">
      {/* Top Header & CSV Export */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Admin Control Center
          </h1>
          <p className="text-sm text-slate-500">
            Manage store analytics, products, orders, users, and promo codes
          </p>
        </div>

        <button
          type="button"
          onClick={handleDownloadCSV}
          className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Export Sales Report (CSV)</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {[
          { id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard },
          { id: 'products', label: 'Products & Categories', icon: Package },
          { id: 'orders', label: 'Orders', icon: ShoppingBag },
          { id: 'users', label: 'Users & Coupons', icon: Users },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
                <IndianRupee className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">
                  Total Sales Revenue
                </p>
                <p className="text-xl font-extrabold text-slate-900">
                  {formatPrice(stats.totalRevenue)}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">
                  Total Orders
                </p>
                <p className="text-xl font-extrabold text-slate-900">
                  {stats.totalOrders}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">
                  Catalog Products
                </p>
                <p className="text-xl font-extrabold text-slate-900">
                  {stats.totalProducts}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-violet-50 text-violet-600">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">
                  Registered Users
                </p>
                <p className="text-xl font-extrabold text-slate-900">
                  {stats.totalUsers}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Revenue Bar Chart */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <h2 className="text-base font-bold text-slate-900">
                Monthly Revenue Overview
              </h2>
              {loading ? (
                <p className="text-sm text-slate-400">Loading chart...</p>
              ) : monthlyRevenue.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No sales recorded yet. Place an order to see monthly revenue bars!
                </p>
              ) : (
                <div className="space-y-3 pt-2">
                  {monthlyRevenue.map((item, idx) => {
                    const label = `${MONTH_NAMES[(item._id.month || 1) - 1]} ${item._id.year}`;
                    const widthPct = Math.max(
                      8,
                      Math.round((item.revenue / maxMonthRev) * 100)
                    );
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-slate-700">
                          <span>
                            {label} ({item.orders} orders)
                          </span>
                          <span>{formatPrice(item.revenue)}</span>
                        </div>
                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${widthPct}%` }}
                            className="h-full bg-indigo-600 rounded-full"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Low-Stock Alerts */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h2 className="text-base font-bold text-slate-900">
                  Low-Stock Alerts (&le; 10 units)
                </h2>
              </div>

              {lowStockProducts.length === 0 ? (
                <p className="text-sm text-emerald-600 font-medium">
                  All products are well-stocked!
                </p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {lowStockProducts.map((p) => (
                    <div
                      key={p._id}
                      className="py-2.5 flex items-center justify-between gap-3 text-sm"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={p.images?.[0]}
                          alt={p.name}
                          className="w-9 h-9 rounded-lg object-cover bg-slate-100 shrink-0"
                        />
                        <span className="font-medium text-slate-800 truncate">
                          {p.name}
                        </span>
                      </div>
                      <span className="text-xs font-bold bg-red-50 text-red-700 px-2.5 py-1 rounded-full shrink-0">
                        {p.stock} left
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'products' && <ManageProducts />}
      {activeTab === 'orders' && <ManageOrders />}
      {activeTab === 'users' && <ManageUsersAndCoupons />}
    </div>
  );
};

export default AdminDashboard;
