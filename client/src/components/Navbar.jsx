import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import { resetCartOnLogout } from '../redux/slices/cartSlice';
import api from '../services/api';
import { formatPrice } from '../utils/formatPrice';
import {
  ShoppingBag,
  ShoppingCart,
  Heart,
  User,
  Search,
  LogOut,
  Shield,
  X,
  Menu,
  Home as HomeIcon,
  Store,
  Package,
} from 'lucide-react';

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { items: cartItems } = useSelector((state) => state.cart);
  const { items: wishlistItems } = useSelector((state) => state.wishlist);

  const totalCartQty = cartItems.reduce(
    (sum, item) => sum + (item.quantity || 1),
    0
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const searchRef = useRef(null);
  const mobileSearchRef = useRef(null);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
    setShowSuggestions(false);
  }, [location.pathname, location.search]);

  // Debounced live search suggestions
  useEffect(() => {
    const trimmed = searchTerm.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get('/products/suggestions', {
          params: { q: trimmed },
        });
        setSuggestions(data.suggestions || []);
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Close suggestions dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      const outsideDesktop =
        !searchRef.current || !searchRef.current.contains(e.target);
      const outsideMobile =
        !mobileSearchRef.current || !mobileSearchRef.current.contains(e.target);
      if (outsideDesktop && outsideMobile) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setShowSuggestions(false);
    setMobileMenuOpen(false);
    if (searchTerm.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      navigate('/products');
    }
  };

  const handleLogout = async () => {
    setMobileMenuOpen(false);
    await dispatch(logout());
    dispatch(resetCartOnLogout());
    navigate('/login');
  };

  const renderSuggestionsList = () =>
    showSuggestions &&
    suggestions.length > 0 && (
      <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden z-50 max-h-80 overflow-y-auto">
        {suggestions.map((item) => (
          <Link
            key={item._id}
            to={`/products/${item.slug || item._id}`}
            onClick={() => setShowSuggestions(false)}
            className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-none"
          >
            <img
              src={
                item.images?.[0] &&
                !item.images[0].includes('1584990347449-a2d4c2c044c9')
                  ? item.images[0]
                  : 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=400&auto=format&fit=crop&q=80'
              }
              alt={item.name}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src =
                  'https://images.unsplash.com/photo-1585515320310-259814833e62?w=400&auto=format&fit=crop&q=80';
              }}
              className="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-indigo-600">
                {item.brand}
              </p>
              <p className="text-sm font-medium text-slate-800 truncate">
                {item.name}
              </p>
            </div>
            <span className="text-sm font-bold text-slate-900 shrink-0">
              {formatPrice(item.discountPrice || item.price)}
            </span>
          </Link>
        ))}
      </div>
    );

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          {/* Top Bar */}
          <div className="h-14 sm:h-16 flex items-center justify-between gap-3">
            {/* Brand Logo */}
            <Link
              to="/"
              className="flex items-center gap-1.5 sm:gap-2 text-xl sm:text-2xl font-extrabold tracking-tight shrink-0"
            >
              <ShoppingBag className="w-6 h-6 sm:w-7 sm:h-7 text-indigo-600 shrink-0" />
              <span>
                <span className="text-slate-900">Shop</span>
                <span className="text-indigo-600">Ease</span>
              </span>
            </Link>

            {/* Desktop Search Bar with Live Suggestions */}
            <div
              ref={searchRef}
              className="hidden md:block flex-1 max-w-md relative"
            >
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onFocus={() =>
                    suggestions.length > 0 && setShowSuggestions(true)
                  }
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search products, brands and categories..."
                  className="w-full pl-10 pr-8 py-2 rounded-full border border-slate-300 text-sm focus:outline-none focus:border-indigo-500"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm('');
                      setSuggestions([]);
                    }}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </form>
              {renderSuggestionsList()}
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-5 text-slate-700 text-sm font-medium">
              <Link to="/" className="hover:text-indigo-600 transition-colors">
                Home
              </Link>
              <Link
                to="/products"
                className="hover:text-indigo-600 transition-colors"
              >
                Shop
              </Link>
              <Link
                to="/wishlist"
                className="hover:text-indigo-600 transition-colors flex items-center gap-1 relative"
              >
                <Heart className="w-5 h-5" />
                <span>Wishlist</span>
                {wishlistItems.length > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                    {wishlistItems.length}
                  </span>
                )}
              </Link>
              <Link
                to="/cart"
                className="hover:text-indigo-600 transition-colors flex items-center gap-1 relative"
              >
                <ShoppingCart className="w-5 h-5" />
                <span>Cart</span>
                {totalCartQty > 0 && (
                  <span className="bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                    {totalCartQty}
                  </span>
                )}
              </Link>

              {isAuthenticated && user ? (
                <div className="flex items-center gap-3">
                  <Link
                    to="/orders"
                    className="hover:text-indigo-600 transition-colors"
                  >
                    Orders
                  </Link>
                  {(user.role === 'admin' || user.role === 'manager') && (
                    <Link
                      to="/admin"
                      className="flex items-center gap-1 text-xs font-semibold bg-amber-100 text-amber-800 px-3 py-1.5 rounded-full hover:bg-amber-200 transition-colors"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span>Admin</span>
                    </Link>
                  )}
                  <Link
                    to="/profile"
                    className="flex items-center gap-1.5 bg-slate-100 text-slate-800 px-3.5 py-1.5 rounded-full hover:bg-slate-200 transition-colors"
                  >
                    <User className="w-4 h-4 text-indigo-600" />
                    <span className="max-w-[110px] truncate">
                      {user.name.split(' ')[0]}
                    </span>
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    title="Sign Out"
                    className="p-2 text-slate-500 hover:text-red-600 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-1.5 bg-indigo-600 text-white px-4 py-2 rounded-full hover:bg-indigo-700 transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span>Sign In</span>
                </Link>
              )}
            </nav>

            {/* Mobile Top Right Actions */}
            <div className="flex md:hidden items-center gap-1.5">
              {isAuthenticated &&
                user &&
                (user.role === 'admin' || user.role === 'manager') && (
                  <Link
                    to="/admin"
                    className="flex items-center gap-1 text-[11px] font-bold bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full"
                  >
                    <Shield className="w-3 h-3" />
                    <span>Admin</span>
                  </Link>
                )}

              <Link
                to="/wishlist"
                aria-label="Wishlist"
                className="relative p-2 text-slate-700 hover:text-indigo-600"
              >
                <Heart className="w-5 h-5" />
                {wishlistItems.length > 0 && (
                  <span className="absolute top-1 right-1 bg-rose-500 text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                    {wishlistItems.length}
                  </span>
                )}
              </Link>

              <Link
                to="/cart"
                aria-label="Cart"
                className="relative p-2 text-slate-700 hover:text-indigo-600"
              >
                <ShoppingCart className="w-5 h-5" />
                {totalCartQty > 0 && (
                  <span className="absolute top-1 right-1 bg-indigo-600 text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                    {totalCartQty}
                  </span>
                )}
              </Link>

              <button
                type="button"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                aria-label="Toggle Menu"
                className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Search Bar Row */}
          <div ref={mobileSearchRef} className="md:hidden pb-2.5 relative">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={searchTerm}
                onFocus={() =>
                  suggestions.length > 0 && setShowSuggestions(true)
                }
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products, brands & categories..."
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs sm:text-sm focus:bg-white focus:outline-none focus:border-indigo-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setSuggestions([]);
                  }}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </form>
            {renderSuggestionsList()}
          </div>
        </div>

        {/* Mobile Slide-Down Drawer Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3 shadow-lg">
            {isAuthenticated && user ? (
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shrink-0">
                    {user.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
                <Link
                  to="/profile"
                  className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg shrink-0"
                >
                  Edit Profile
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                <Link
                  to="/login"
                  className="text-center bg-indigo-600 text-white text-xs font-semibold py-2.5 rounded-xl"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="text-center bg-slate-100 text-slate-800 text-xs font-semibold py-2.5 rounded-xl"
                >
                  Create Account
                </Link>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-700">
              <Link
                to="/"
                className="flex items-center gap-2 p-2.5 rounded-xl hover:bg-slate-50 border border-slate-100"
              >
                <HomeIcon className="w-4 h-4 text-indigo-600" />
                <span>Home</span>
              </Link>
              <Link
                to="/products"
                className="flex items-center gap-2 p-2.5 rounded-xl hover:bg-slate-50 border border-slate-100"
              >
                <Store className="w-4 h-4 text-indigo-600" />
                <span>All Products</span>
              </Link>
              <Link
                to="/orders"
                className="flex items-center gap-2 p-2.5 rounded-xl hover:bg-slate-50 border border-slate-100"
              >
                <Package className="w-4 h-4 text-indigo-600" />
                <span>My Orders</span>
              </Link>
              <Link
                to="/wishlist"
                className="flex items-center gap-2 p-2.5 rounded-xl hover:bg-slate-50 border border-slate-100"
              >
                <Heart className="w-4 h-4 text-rose-500" />
                <span>Wishlist ({wishlistItems.length})</span>
              </Link>
            </div>

            {isAuthenticated && user && (
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 py-2.5 rounded-xl transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            )}
          </div>
        )}
      </header>

      {/* Mobile Sticky Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 flex items-center justify-around shadow-lg">
        <Link
          to="/"
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-[11px] font-semibold transition-colors ${
            location.pathname === '/'
              ? 'text-indigo-600'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <HomeIcon className="w-5 h-5" />
          <span>Home</span>
        </Link>

        <Link
          to="/products"
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-[11px] font-semibold transition-colors ${
            location.pathname.startsWith('/products')
              ? 'text-indigo-600'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Store className="w-5 h-5" />
          <span>Shop</span>
        </Link>

        <Link
          to="/wishlist"
          className={`relative flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-[11px] font-semibold transition-colors ${
            location.pathname === '/wishlist'
              ? 'text-indigo-600'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Heart className="w-5 h-5" />
          <span>Wishlist</span>
          {wishlistItems.length > 0 && (
            <span className="absolute top-0.5 right-2 bg-rose-500 text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
              {wishlistItems.length}
            </span>
          )}
        </Link>

        <Link
          to="/cart"
          className={`relative flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-[11px] font-semibold transition-colors ${
            location.pathname === '/cart'
              ? 'text-indigo-600'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <ShoppingCart className="w-5 h-5" />
          <span>Cart</span>
          {totalCartQty > 0 && (
            <span className="absolute top-0.5 right-2 bg-indigo-600 text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
              {totalCartQty}
            </span>
          )}
        </Link>

        <Link
          to={isAuthenticated ? '/orders' : '/login'}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-[11px] font-semibold transition-colors ${
            location.pathname.startsWith('/orders') ||
            location.pathname === '/profile' ||
            location.pathname === '/login'
              ? 'text-indigo-600'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          {isAuthenticated ? (
            <>
              <Package className="w-5 h-5" />
              <span>Orders</span>
            </>
          ) : (
            <>
              <User className="w-5 h-5" />
              <span>Sign In</span>
            </>
          )}
        </Link>
      </nav>
    </>
  );
};

export default Navbar;
