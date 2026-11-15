import { Link } from 'react-router-dom';
import { Heart, MapPin, ShieldCheck, ShoppingBag } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-950 text-slate-400 pt-10 pb-24 md:py-12 mt-auto border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 text-sm">
        {/* Top Section: Brand, Quick Shop Links & Customer Policies */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 border-b border-slate-800/80 pb-8">
          {/* Brand & Location */}
          <div className="md:col-span-5 space-y-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2 font-extrabold text-white text-xl tracking-tight"
            >
              <ShoppingBag className="w-6 h-6 text-indigo-400 shrink-0" />
              <span>
                Shop<span className="text-indigo-400">Ease</span>
              </span>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Your trusted destination for premium Electronics, Fashion, Home
              &amp; Lifestyle essentials with fast express delivery and 7-day
              easy returns across India.
            </p>
            <div className="inline-flex items-center gap-1.5 text-xs text-slate-300 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full">
              <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>Gorakhpur, Uttar Pradesh, India</span>
            </div>
          </div>

          {/* Quick Shop Links */}
          <div className="md:col-span-3 space-y-2.5 text-xs">
            <p className="font-bold text-white uppercase tracking-wider text-[11px]">
              Quick Shop
            </p>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/products"
                  className="hover:text-white transition-colors"
                >
                  All Products
                </Link>
              </li>
              <li>
                <Link
                  to="/orders"
                  className="hover:text-white transition-colors"
                >
                  Track My Orders
                </Link>
              </li>
              <li>
                <Link
                  to="/wishlist"
                  className="hover:text-white transition-colors"
                >
                  My Wishlist
                </Link>
              </li>
              <li>
                <Link to="/cart" className="hover:text-white transition-colors">
                  Shopping Cart
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Care & Policies */}
          <div className="md:col-span-4 space-y-2.5 text-xs">
            <p className="font-bold text-white uppercase tracking-wider text-[11px]">
              Customer Care &amp; Policies
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Link
                to="/info/about"
                className="hover:text-white transition-colors"
              >
                About Us
              </Link>
              <Link
                to="/info/contact"
                className="hover:text-white transition-colors"
              >
                Contact Support
              </Link>
              <Link
                to="/info/returns"
                className="hover:text-white transition-colors"
              >
                7-Day Return Policy
              </Link>
              <Link
                to="/info/faq"
                className="hover:text-white transition-colors"
              >
                Help &amp; FAQ
              </Link>
              <Link
                to="/info/privacy"
                className="hover:text-white transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                to="/info/terms"
                className="hover:text-white transition-colors"
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright, Developer Credit & Payment Badges */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-2 gap-y-1 text-center lg:text-left">
            <span>
              &copy; {new Date().getFullYear()} ShopEase. All rights reserved.
            </span>
            <span className="hidden sm:inline text-slate-700">&bull;</span>
            <span className="inline-flex items-center gap-1">
              Developed by{' '}
              <span className="text-indigo-400 font-semibold">
                @snishanishad
              </span>
              <Heart
                className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline-block"
                aria-hidden="true"
              />
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold mr-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Secure Payments:
            </span>
            {['PhonePe', 'Google Pay', 'UPI QR', 'Visa', 'MasterCard', 'RuPay'].map(
              (badge) => (
                <span
                  key={badge}
                  className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-[11px] font-semibold text-slate-300"
                >
                  {badge}
                </span>
              )
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
