import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addItemToCart } from '../redux/slices/cartSlice';
import { toggleWishlist } from '../redux/slices/wishlistSlice';
import { Star, ShoppingCart, Heart, Check } from 'lucide-react';
import { formatPrice, getDiscountPercent } from '../utils/formatPrice';

const ProductCard = ({ product }) => {
  const dispatch = useDispatch();
  const { items: wishlistItems } = useSelector((state) => state.wishlist);
  const [added, setAdded] = useState(false);

  const isWishlisted = wishlistItems.some((item) => item._id === product._id);

  const effectivePrice =
    product.discountPrice && product.discountPrice > 0
      ? product.discountPrice
      : product.price;
  const discountPercent = getDiscountPercent(
    product.price,
    product.discountPrice
  );
  const fallbackImage =
    'https://images.unsplash.com/photo-1585515320310-259814833e62?w=600&auto=format&fit=crop&q=80';
  const imageUrl =
    product.images?.[0] &&
    !product.images[0].includes('1584990347449-a2d4c2c044c9')
      ? product.images[0]
      : fallbackImage;

  const handleQuickAdd = (e) => {
    e.preventDefault();
    if (product.stock <= 0) return;
    const defaultVariant = product.variants?.[0] || { size: '', color: '' };
    dispatch(
      addItemToCart({
        product,
        quantity: 1,
        variant: {
          size: defaultVariant.size || '',
          color: defaultVariant.color || '',
        },
      })
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  const handleWishlistToggle = (e) => {
    e.preventDefault();
    dispatch(toggleWishlist(product));
  };

  return (
    <div className="group bg-white rounded-xl sm:rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md transition-all flex flex-col h-full">
      {/* Product Image & Badges */}
      <div className="relative aspect-square bg-slate-100 overflow-hidden">
        <Link
          to={`/products/${product.slug || product._id}`}
          className="block w-full h-full"
        >
          <img
            src={imageUrl}
            alt={product.name}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = fallbackImage;
            }}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </Link>

        {discountPercent > 0 && (
          <span className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-rose-600 text-white text-[10px] sm:text-xs font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full">
            {discountPercent}% OFF
          </span>
        )}

        {/* Wishlist Heart Toggle */}
        <button
          type="button"
          onClick={handleWishlistToggle}
          title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
          className="absolute top-2 right-2 sm:top-3 sm:right-3 p-1.5 sm:p-2 rounded-full bg-white/90 hover:bg-white shadow-xs transition-colors cursor-pointer"
        >
          <Heart
            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
              isWishlisted
                ? 'fill-rose-500 text-rose-500'
                : 'text-slate-600 hover:text-rose-500'
            }`}
          />
        </button>

        {product.stock <= 0 && (
          <span className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 bg-slate-900/80 text-white text-[10px] sm:text-xs font-semibold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full">
            Out of Stock
          </span>
        )}
      </div>

      {/* Product Info */}
      <div className="p-2.5 sm:p-4 flex-1 flex flex-col justify-between space-y-2 sm:space-y-3">
        <div>
          <div className="flex items-center justify-between gap-1 text-[10px] sm:text-xs text-slate-500 mb-1">
            <span className="font-semibold uppercase tracking-wider text-indigo-600 truncate">
              {product.brand}
            </span>
            {product.category?.name && (
              <span className="hidden sm:inline truncate">
                {product.category.name}
              </span>
            )}
          </div>

          <Link
            to={`/products/${product.slug || product._id}`}
            className="font-semibold text-slate-900 text-xs sm:text-sm line-clamp-2 group-hover:text-indigo-600 transition-colors leading-snug"
          >
            {product.name}
          </Link>

          {/* Rating */}
          <div className="flex items-center gap-1 sm:gap-1.5 mt-1.5 sm:mt-2">
            <div className="inline-flex items-center gap-0.5 sm:gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-1.5 sm:px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-semibold">
              <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-amber-400 text-amber-400" />
              <span>{Number(product.ratings || 0).toFixed(1)}</span>
            </div>
            <span className="text-[10px] sm:text-xs text-slate-400 truncate">
              ({product.numReviews || 0})
            </span>
          </div>
        </div>

        {/* Price & Action */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5 sm:gap-2">
          <div className="min-w-0">
            <span className="text-sm sm:text-base font-bold text-slate-900 block sm:inline leading-tight">
              {formatPrice(effectivePrice)}
            </span>
            {discountPercent > 0 && (
              <span className="text-[10px] sm:text-xs text-slate-400 line-through sm:ml-1.5 block sm:inline">
                {formatPrice(product.price)}
              </span>
            )}
          </div>

          <button
            type="button"
            disabled={product.stock <= 0}
            onClick={handleQuickAdd}
            aria-label={added ? 'Added to Cart' : 'Add to Cart'}
            className={`inline-flex items-center justify-center gap-1.5 text-white text-xs font-semibold w-8 h-8 sm:w-auto sm:h-auto sm:px-3 sm:py-2 rounded-lg sm:rounded-xl transition-colors cursor-pointer shrink-0 disabled:bg-slate-300 ${
              added
                ? 'bg-emerald-600'
                : 'bg-slate-900 hover:bg-indigo-600'
            }`}
          >
            {added ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Added</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Add</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
