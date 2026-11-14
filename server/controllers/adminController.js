import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import Category from '../models/Category.js';
import Visitor from '../models/Visitor.js';

/**
 * @desc    Get Admin Dashboard Analytics (Sales, Orders, Users, Low Stock, Monthly Revenue, Website Visitors)
 * @route   GET /api/admin/stats
 * @access  Private (Admin / Manager)
 */
export const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalProducts,
      totalCategories,
      totalOrders,
      lowStockProducts,
      recentOrders,
      revenueAgg,
      monthlyRevenue,
      visitorAgg,
      recentVisitors,
    ] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      Category.countDocuments(),
      Order.countDocuments(),
      Product.find({ stock: { $lte: 10 } })
        .select('name stock price brand images')
        .sort({ stock: 1 })
        .limit(8),
      Order.find()
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .limit(6),
      Order.aggregate([
        { $match: { orderStatus: { $ne: 'Cancelled' } } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalPrice' },
            paidRevenue: {
              $sum: { $cond: [{ $eq: ['$isPaid', true] }, '$totalPrice', 0] },
            },
          },
        },
      ]),
      Order.aggregate([
        { $match: { orderStatus: { $ne: 'Cancelled' } } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            revenue: { $sum: '$totalPrice' },
            orders: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 6 },
      ]),
      Visitor.aggregate([
        {
          $group: {
            _id: null,
            totalWebsiteClicks: { $sum: '$visitCount' },
            uniqueVisitors: { $sum: 1 },
            visitorsWithEmail: {
              $sum: {
                $cond: [
                  { $and: [{ $ne: ['$email', ''] }, { $ne: ['$email', null] }] },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]),
      Visitor.find()
        .sort({ lastVisitedAt: -1 })
        .limit(100),
    ]);

    const totalRevenue = revenueAgg[0]?.totalRevenue || 0;
    const paidRevenue = revenueAgg[0]?.paidRevenue || 0;
    const totalWebsiteClicks = visitorAgg[0]?.totalWebsiteClicks || 0;
    const uniqueVisitors = visitorAgg[0]?.uniqueVisitors || 0;
    const visitorsWithEmail = visitorAgg[0]?.visitorsWithEmail || 0;

    res.status(200).json({
      success: true,
      stats: {
        totalRevenue,
        paidRevenue,
        totalOrders,
        totalUsers,
        totalProducts,
        totalCategories,
        totalWebsiteClicks,
        uniqueVisitors,
        visitorsWithEmail,
      },
      lowStockProducts,
      recentOrders,
      monthlyRevenue: monthlyRevenue.reverse(),
      visitors: recentVisitors,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all registered users (Admin)
 * @route   GET /api/admin/users
 * @access  Private (Admin / Manager)
 */
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user role (customer/manager/admin) or block/unblock account
 * @route   PUT /api/admin/users/:id
 * @access  Private (Admin)
 */
export const updateUserRoleOrStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    // Prevent admin from accidentally blocking or demoting their own account
    if (user._id.toString() === req.user._id.toString()) {
      res.status(400);
      throw new Error('You cannot change your own role or block your own account');
    }

    if (req.body.role !== undefined) {
      user.role = req.body.role;
    }
    if (req.body.isBlocked !== undefined) {
      user.isBlocked = Boolean(req.body.isBlocked);
    }

    const updatedUser = await user.save();

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Export sales & orders report as CSV
 * @route   GET /api/admin/reports/sales
 * @access  Private (Admin / Manager)
 */
export const exportSalesReportCSV = async (req, res, next) => {
  try {
    const orders = await Order.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    const headers = [
      'Order ID',
      'Date',
      'Customer Name',
      'Customer Email',
      'Items Count',
      'Payment Method',
      'Paid Status',
      'Order Status',
      'Discount (INR)',
      'Total Amount (INR)',
    ];

    const rows = orders.map((o) => [
      o._id,
      new Date(o.createdAt).toISOString().split('T')[0],
      `"${(o.user?.name || o.shippingAddress?.fullName || 'Guest').replace(/"/g, '""')}"`,
      o.user?.email || '',
      o.orderItems.reduce((sum, i) => sum + i.qty, 0),
      o.paymentMethod,
      o.isPaid ? 'Paid' : 'Unpaid',
      o.orderStatus,
      o.discount || 0,
      o.totalPrice,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="shopease_sales_report.csv"'
    );
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};
