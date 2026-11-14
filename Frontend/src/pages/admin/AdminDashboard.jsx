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
  MousePointerClick,
  Mail,
  Smartphone,
  Monitor,
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
    if (activeTab === 'overview' || activeTab === 'visitors') {
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
    totalWebsiteClicks: 0,
    uniqueVisitors: 0,
    visitorsWithEmail: 0,
  };
  const lowStockProducts = dashboardData?.lowStockProducts || [];
  const monthlyRevenue = dashboardData?.monthlyRevenue || [];
  const visitors = dashboardData?.visitors || [];
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
          { id: 'visitors', label: 'Visitors & Link Clicks', icon: MousePointerClick },
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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

            <div
              onClick={() => setActiveTab('visitors')}
              className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4 cursor-pointer hover:border-indigo-300 transition-colors"
            >
              <div className="p-3 rounded-xl bg-sky-50 text-sky-600">
                <MousePointerClick className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">
                  Web Link Clicks
                </p>
                <p className="text-xl font-extrabold text-slate-900">
                  {stats.totalWebsiteClicks}
                </p>
                <p className="text-[11px] text-slate-400">
                  {stats.uniqueVisitors} visitors ({stats.visitorsWithEmail} emails)
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

      {activeTab === 'visitors' && (
        <div className="space-y-6">
          {/* Summary Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
                <MousePointerClick className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">
                  Total Website Link Clicks
                </p>
                <p className="text-2xl font-extrabold text-slate-900">
                  {stats.totalWebsiteClicks}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">
                  Unique Website Visitors
                </p>
                <p className="text-2xl font-extrabold text-slate-900">
                  {stats.uniqueVisitors}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">
                  Visitors With Email Saved
                </p>
                <p className="text-2xl font-extrabold text-slate-900">
                  {stats.visitorsWithEmail}
                </p>
              </div>
            </div>
          </div>

          {/* Visitor & Email Log Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Website Visitors &amp; Email Click Tracker
                </h2>
                <p className="text-xs text-slate-500">
                  Automatically tracks every website link click and saves visitor email &amp; visit count in MongoDB
                </p>
              </div>
              <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">
                {visitors.length} Visitor Records
              </span>
            </div>

            {visitors.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                No visitor records yet. Refresh the website to see your first tracked visit!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider border-b border-slate-200">
                      <th className="py-3 px-4 font-semibold">Visitor Email &amp; Name</th>
                      <th className="py-3 px-4 font-semibold">Web Link Clicks</th>
                      <th className="py-3 px-4 font-semibold">Device</th>
                      <th className="py-3 px-4 font-semibold">Last Page</th>
                      <th className="py-3 px-4 font-semibold">Last Visited</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visitors.map((v) => (
                      <tr key={v._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          {v.email ? (
                            <div>
                              <p className="font-bold text-slate-900">{v.email}</p>
                              {v.name && (
                                <p className="text-xs text-slate-500">{v.name}</p>
                              )}
                            </div>
                          ) : (
                            <div>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                                Guest Visitor (Not Logged In)
                              </span>
                              <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                                ID: {v.visitorId?.slice(0, 14)}
                              </p>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                            <MousePointerClick className="w-3.5 h-3.5" />
                            {v.visitCount} {v.visitCount === 1 ? 'click' : 'clicks'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700">
                            {v.deviceType === 'Mobile' ? (
                              <Smartphone className="w-4 h-4 text-indigo-500" />
                            ) : (
                              <Monitor className="w-4 h-4 text-slate-500" />
                            )}
                            {v.deviceType || 'Desktop'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs font-mono text-slate-600">
                          {v.lastPath || '/'}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-500">
                          {v.lastVisitedAt
                            ? new Date(v.lastVisitedAt).toLocaleString('en-IN', {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                              })
                            : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
