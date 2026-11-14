import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCurrentUser } from './redux/slices/authSlice';
import { syncAndMergeCart } from './redux/slices/cartSlice';
import { fetchWishlist } from './redux/slices/wishlistSlice';
import api from './services/api';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './routes/ProtectedRoute';
import AdminRoute from './routes/AdminRoute';

// Lazy-loaded pages for route-level code splitting & faster initial load
const Home = lazy(() => import('./pages/Home'));
const Products = lazy(() => import('./pages/Products'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Cart = lazy(() => import('./pages/Cart'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Orders = lazy(() => import('./pages/Orders'));
const OrderDetail = lazy(() => import('./pages/OrderDetail'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Profile = lazy(() => import('./pages/Profile'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const StaticInfo = lazy(() => import('./pages/StaticInfo'));

const PageLoader = () => (
  <div className="py-24 flex justify-center items-center">
    <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

const App = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated, initializing } = useSelector(
    (state) => state.auth
  );

  // 1. Check if user has a valid httpOnly JWT cookie on app load
  useEffect(() => {
    dispatch(fetchCurrentUser());
  }, [dispatch]);

  // 2. Automatically track website link click & associate user email in MongoDB
  useEffect(() => {
    if (initializing) return;

    let visitorId = localStorage.getItem('shopease_visitor_id');
    if (!visitorId) {
      visitorId = `v_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem('shopease_visitor_id', visitorId);
    }

    const alreadyCountedThisTab = sessionStorage.getItem(
      'shopease_visit_tracked'
    );
    const shouldIncrement = !alreadyCountedThisTab;

    api
      .post('/auth/track-visit', {
        visitorId,
        path: window.location.pathname,
        increment: shouldIncrement,
        email: user?.email || '',
        name: user?.name || '',
      })
      .then((res) => {
        if (res.data?.visitorId) {
          localStorage.setItem('shopease_visitor_id', res.data.visitorId);
        }
        sessionStorage.setItem('shopease_visit_tracked', '1');
      })
      .catch(() => {
        // Ignore network errors silently so user experience is unaffected
      });
  }, [initializing, isAuthenticated, user?.email, user?.name]);

  // 3. Whenever auth initialization finishes or login state changes,
  // sync & merge guest localStorage cart/wishlist with MongoDB
  useEffect(() => {
    if (!initializing) {
      dispatch(syncAndMergeCart());
      dispatch(fetchWishlist());
    }
  }, [dispatch, isAuthenticated, initializing]);

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-slate-50/40">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              <Route path="/info/:pageSlug" element={<StaticInfo />} />

              {/* Protected Customer Routes */}
              <Route
                path="/checkout"
                element={
                  <ProtectedRoute>
                    <Checkout />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/orders"
                element={
                  <ProtectedRoute>
                    <Orders />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/orders/:id"
                element={
                  <ProtectedRoute>
                    <OrderDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />

              {/* Protected Admin & Manager Route */}
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                }
              />
            </Routes>
          </Suspense>
        </main>
        <Footer />
      </div>
    </Router>
  );
};

export default App;
