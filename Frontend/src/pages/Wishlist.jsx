import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ProductCard from '../components/ProductCard';
import { Heart, ArrowRight } from 'lucide-react';

const Wishlist = () => {
  const { items: wishlistItems } = useSelector((state) => state.wishlist);

  if (wishlistItems.length === 0) {
    return (
      <div className="py-20 text-center space-y-5 max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
          <Heart className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">
          Your Wishlist is Empty
        </h1>
        <p className="text-sm text-slate-500">
          Tap the heart icon on any product to save your favorite items here for later.
        </p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-full transition-colors"
        >
          <span>Explore Products</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="py-4 sm:py-8 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
          My Wishlist
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          {wishlistItems.length}{' '}
          {wishlistItems.length === 1 ? 'saved item' : 'saved items'}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {wishlistItems.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </div>
  );
};

export default Wishlist;
